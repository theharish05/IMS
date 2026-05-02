from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
import datetime
from .db import Base

class WorkItem(Base):
    __tablename__ = "work_items"

    id = Column(Integer, primary_key=True, index=True)
    component_id = Column(String, index=True)
    state = Column(String, default="OPEN") 
    severity = Column(String)
    start_time = Column(Float)
    end_time = Column(Float, nullable=True)
    
    rca = relationship("RCA", back_populates="work_item", uselist=False)

class RCA(Base):
    __tablename__ = "rcas"

    id = Column(Integer, primary_key=True, index=True)
    work_item_id = Column(Integer, ForeignKey("work_items.id"), unique=True)
    root_cause_category = Column(String)
    fix_applied = Column(Text)
    prevention_steps = Column(Text)

    work_item = relationship("WorkItem", back_populates="rca")
