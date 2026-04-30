import asyncio
import aio_pika
import json
import time
from sqlalchemy.future import select
from .config import settings
from .models.db import AsyncSessionLocal, signals_collection
from .models.schema import WorkItem
from .patterns.strategy import AlertContext, get_alert_strategy
import redis.asyncio as redis

redis_client = redis.from_url(settings.redis_url)

async def process_message(message: aio_pika.IncomingMessage):
    async with message.process():
        signal = json.loads(message.body.decode())
        component_id = signal["component_id"]
        severity = signal["severity"]
        
        # Debouncing Logic using Redis
        # If we received a signal for this component in the last 10s, don't create a new work item.
        debounce_key = f"debounce:{component_id}"
        is_debounced = await redis_client.get(debounce_key)
        
        # We also want to know the active Work Item ID for this component
        active_work_item_key = f"active_wi:{component_id}"
        active_wi_id = await redis_client.get(active_work_item_key)
        
        work_item_id = None
        
        if is_debounced and active_wi_id:
            # Linked to existing work item
            work_item_id = int(active_wi_id.decode())
        else:
            # Create a new Work Item
            async with AsyncSessionLocal() as session:
                new_wi = WorkItem(
                    component_id=component_id,
                    severity=severity,
                    start_time=signal["timestamp"]
                )
                session.add(new_wi)
                await session.commit()
                await session.refresh(new_wi)
                work_item_id = new_wi.id
                
            # Set debounce window (10 seconds)
            await redis_client.setex(debounce_key, 10, "1")
            await redis_client.set(active_work_item_key, str(work_item_id))
            
            # Trigger Alert for new incident
            alert_context = AlertContext(get_alert_strategy(severity))
            alert_context.execute_alert(component_id, signal["payload"])
        
        # Write Raw Signal to MongoDB
        signal["work_item_id"] = work_item_id
        await signals_collection.insert_one(signal)

async def main():
    connection = await aio_pika.connect_robust(settings.rabbitmq_url)
    channel = await connection.channel()
    
    queue = await channel.declare_queue("signals_queue", durable=False)
    print("Worker is waiting for messages...")
    
    await queue.consume(process_message)
    
    try:
        await asyncio.Future()
    finally:
        await connection.close()

if __name__ == "__main__":
    asyncio.run(main())
