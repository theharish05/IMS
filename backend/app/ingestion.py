from fastapi import APIRouter, Request, HTTPException, Depends
from pydantic import BaseModel
import time
import json
import aio_pika
from .config import settings
import redis.asyncio as redis
from typing import Dict, Any

router = APIRouter()

class Signal(BaseModel):
    component_id: str
    severity: str # P0, P1, P2
    payload: Dict[str, Any]
    timestamp: float

# Redis connection for rate limiting
redis_client = redis.from_url(settings.redis_url)

# RabbitMQ connection pool
mq_connection = None
mq_channel = None

async def get_mq_channel():
    global mq_connection, mq_channel
    if not mq_channel:
        mq_connection = await aio_pika.connect_robust(settings.rabbitmq_url)
        mq_channel = await mq_connection.channel()
    return mq_channel

async def check_rate_limit(client_ip: str):
    # Simple rate limiting: max 1000 requests per second per IP
    key = f"rate_limit:{client_ip}:{int(time.time())}"
    count = await redis_client.incr(key)
    if count == 1:
        await redis_client.expire(key, 2)
    if count > 1000:
        raise HTTPException(status_code=429, detail="Too Many Requests")

@router.post("/signals")
async def ingest_signal(signal: Signal, request: Request, channel: aio_pika.Channel = Depends(get_mq_channel)):
    client_ip = request.client.host if request.client else "unknown"
    await check_rate_limit(client_ip)

    # Update metrics in main app
    from .main import throughput_metrics
    throughput_metrics["signals_received"] += 1

    # Publish to RabbitMQ
    message = aio_pika.Message(
        body=json.dumps(signal.model_dump()).encode()
    )
    await channel.default_exchange.publish(
        message, routing_key="signals_queue"
    )

    return {"status": "accepted"}
