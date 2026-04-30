import asyncio
import json
import time
from fastapi import APIRouter, HTTPException, Request, Response, BackgroundTasks
from pydantic import BaseModel
import redis.asyncio as redis
from aiokafka import AIOKafkaProducer
from .config import settings

router = APIRouter()
redis_client = redis.from_url(settings.redis_url)

# Global producer instance
producer = None

@router.on_event("startup")
async def startup_event():
    global producer
    producer = AIOKafkaProducer(
        bootstrap_servers=settings.kafka_bootstrap_servers
    )
    while True:
        try:
            await producer.start()
            print("Successfully connected to Kafka producer.")
            break
        except Exception as e:
            print(f"Waiting for Kafka: {e}")
            await asyncio.sleep(5)

@router.on_event("shutdown")
async def shutdown_event():
    global producer
    if producer:
        await producer.stop()

class SignalPayload(BaseModel):
    component_id: str
    severity: str
    payload: dict
    timestamp: float = None

@router.post("/ingest", status_code=202)
async def ingest_signal(signal: SignalPayload, request: Request):
    from .main import throughput_metrics
    
    if not signal.timestamp:
        signal.timestamp = time.time()
        
    # Rate Limiting via Redis (e.g. max 10000 req per second per IP/Global)
    # For a high volume system, we might just use a token bucket or simple counter
    # Here we implement a simple counter for rate limiting
    current_time = int(time.time())
    rate_limit_key = f"ratelimit:{current_time}"
    
    # We will just increment and if it exceeds 15000, we drop or reject.
    current_count = await redis_client.incr(rate_limit_key)
    if current_count == 1:
        await redis_client.expire(rate_limit_key, 2)
        
    if current_count > 15000:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    throughput_metrics["signals_received"] += 1

    try:
        # Publish to Kafka instantly
        message = json.dumps(signal.model_dump()).encode("utf-8")
        await producer.send_and_wait("signals_topic", message)
    except Exception as e:
        print(f"Error publishing to Kafka: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

    return {"status": "Accepted"}
