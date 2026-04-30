from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from .models.db import AsyncSessionLocal, signals_collection
from .models.schema import WorkItem, RCA
from .patterns.state import WorkItemStateContext
from pydantic import BaseModel
import time

router = APIRouter()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

@router.get("/incidents")
async def get_incidents(db=Depends(get_db)):
    result = await db.execute(select(WorkItem).order_by(WorkItem.id.desc()))
    items = result.scalars().all()
    return [{"id": i.id, "component_id": i.component_id, "state": i.state, "severity": i.severity, "start_time": i.start_time, "end_time": i.end_time} for i in items]

@router.get("/incidents/{incident_id}")
async def get_incident(incident_id: int, db=Depends(get_db)):
    result = await db.execute(select(WorkItem).options(selectinload(WorkItem.rca)).filter(WorkItem.id == incident_id))
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    # Get raw signals
    signals_cursor = signals_collection.find({"work_item_id": incident_id})
    signals = await signals_cursor.to_list(length=100)
    for s in signals:
        s["_id"] = str(s["_id"])
        
    rca_data = None
    if item.rca:
        rca_data = {
            "root_cause_category": item.rca.root_cause_category,
            "fix_applied": item.rca.fix_applied,
            "prevention_steps": item.rca.prevention_steps
        }
        
    return {
        "id": item.id,
        "component_id": item.component_id,
        "state": item.state,
        "severity": item.severity,
        "start_time": item.start_time,
        "end_time": item.end_time,
        "rca": rca_data,
        "signals": signals
    }

class StateTransitionRequest(BaseModel):
    new_state: str

class RCASubmission(BaseModel):
    root_cause_category: str
    fix_applied: str
    prevention_steps: str

@router.post("/incidents/{incident_id}/state")
async def change_incident_state(incident_id: int, req: StateTransitionRequest, db=Depends(get_db)):
    result = await db.execute(select(WorkItem).options(selectinload(WorkItem.rca)).filter(WorkItem.id == incident_id))
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    context = WorkItemStateContext(item, item.rca)
    try:
        context.transition_to(req.new_state)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    if req.new_state == "CLOSED":
        item.end_time = time.time()
        
    await db.commit()
    return {"status": "success", "new_state": item.state}

@router.post("/incidents/{incident_id}/rca")
async def submit_rca(incident_id: int, rca: RCASubmission, db=Depends(get_db)):
    result = await db.execute(select(WorkItem).filter(WorkItem.id == incident_id))
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    # Check if RCA already exists
    existing_rca_res = await db.execute(select(RCA).filter(RCA.work_item_id == incident_id))
    existing_rca = existing_rca_res.scalars().first()
    
    current_rca = None
    if existing_rca:
        existing_rca.root_cause_category = rca.root_cause_category
        existing_rca.fix_applied = rca.fix_applied
        existing_rca.prevention_steps = rca.prevention_steps
        current_rca = existing_rca
    else:
        new_rca = RCA(
            work_item_id=incident_id,
            root_cause_category=rca.root_cause_category,
            fix_applied=rca.fix_applied,
            prevention_steps=rca.prevention_steps
        )
        db.add(new_rca)
        current_rca = new_rca
        
    context = WorkItemStateContext(item, current_rca)
    try:
        context.transition_to("CLOSED")
        item.end_time = time.time()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    await db.commit()
    return {"status": "success"}
