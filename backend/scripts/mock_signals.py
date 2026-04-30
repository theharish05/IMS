import asyncio
import httpx
import time
import random
import uuid

async def send_signal(client, component_id, severity, payload, sem):
    async with sem:
        url = "http://localhost:8000/api/v1/ingest"
        data = {
            "component_id": component_id,
            "severity": severity,
            "payload": payload,
            "timestamp": time.time()
        }
        try:
            response = await client.post(url, json=data)
            if response.status_code != 202:
                print(f"Error: {response.status_code} - {response.text}")
        except Exception as e:
            pass # Silently drop connection errors to prevent console spam

async def main():
    components = ["database-cluster-1", "cache-layer-2", "auth-service", "payment-gateway"]
    severities = ["P0", "P1", "P2", "INFO"]
    
    # Burst 10,000 signals
    print("Sending 10,000 signals burst...")
    start_time = time.time()
    
    sem = asyncio.Semaphore(100) # Limit concurrency to 100
    
    async with httpx.AsyncClient(limits=httpx.Limits(max_connections=100, max_keepalive_connections=20)) as client:
        tasks = []
        for i in range(10000):
            comp = random.choice(components)
            sev = random.choice(severities)
            payload = {"error_code": random.randint(100, 599), "message": f"Random error {uuid.uuid4()}"}
            tasks.append(send_signal(client, comp, sev, payload, sem))
            
        await asyncio.gather(*tasks)
        
    end_time = time.time()
    print(f"Sent 10,000 signals in {end_time - start_time:.2f} seconds")

if __name__ == "__main__":
    asyncio.run(main())
