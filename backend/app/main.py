from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .ingestion import router as ingestion_router
from .config import settings
import time
import asyncio

app = FastAPI(title="Incident Management System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingestion_router, prefix="/api/v1")

from .routes import router as ui_router
app.include_router(ui_router, prefix="/api/v1")

# Metrics tracking
throughput_metrics = {"signals_received": 0}

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(print_throughput_metrics())

async def print_throughput_metrics():
    while True:
        await asyncio.sleep(5)
        print(f"[METRICS] Throughput: {throughput_metrics['signals_received'] / 5} signals/sec")
        throughput_metrics["signals_received"] = 0

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
