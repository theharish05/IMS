import asyncio
import httpx
import time
import random

async def send_signal(client, component_id, severity):
    url = "http://localhost:8000/api/v1/signals"
    payload = {
        "component_id": component_id,
        "severity": severity,
        "payload": {
            "error_code": random.randint(100, 500),
            "message": "Simulated error"
        },
        "timestamp": time.time()
    }
    await client.post(url, json=payload)

async def main():
    async with httpx.AsyncClient() as client:
        print("Sending 100 debounced signals for CACHE_01 (P2)...")
        tasks = []
        for i in range(100):
            tasks.append(send_signal(client, "CACHE_01", "P2"))
        
        await asyncio.gather(*tasks)
        print("Sent 100 signals. Should only create 1 Work Item.")
        
        print("Sending single critical signal for RDBMS_MASTER (P0)...")
        await send_signal(client, "RDBMS_MASTER", "P0")
        
        print("Done.")

if __name__ == "__main__":
    asyncio.run(main())
