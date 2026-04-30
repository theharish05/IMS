from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .ingestion import router as ingestion_router
from .routes import router as ui_router
from .models.db import pg_engine, Base
import asyncio
from contextlib import asynccontextmanager

# Metrics tracking
throughput_metrics = {"signals_received": 0}

async def print_throughput_metrics():
    while True:
        await asyncio.sleep(5)
        print(f"[METRICS] Throughput: {throughput_metrics['signals_received'] / 5} signals/sec")
        throughput_metrics["signals_received"] = 0

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema
    async with pg_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Start metrics task
    task = asyncio.create_task(print_throughput_metrics())
    yield
    task.cancel()

app = FastAPI(title="Incident Management System API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingestion_router, prefix="/api/v1")
app.include_router(ui_router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
