# Incident Management System (IMS)

## Overview
This is a resilient Incident Management System designed to ingest high-volume signals and manage failure mediation workflow. It utilizes a modern tech stack to ensure reliability, concurrency, and performance under heavy load.

## Tech Stack
- **Backend**: FastAPI, Python Asyncio
- **Message Broker**: RabbitMQ
- **Databases**: 
  - PostgreSQL (Relational Source of Truth for Work Items & RCA)
  - MongoDB (NoSQL Data Lake for raw signals)
  - Redis (In-memory Cache and Rate Limiting)
- **Frontend**: React, Vite, TailwindCSS

## Architecture & Backpressure Handling
The system employs an event-driven architecture to handle spikes up to 10,000 signals/sec:
1. **Ingestion (FastAPI)**: Receives signals. A Redis-backed rate limiter protects the API from DDOS. Valid signals are immediately pushed to RabbitMQ.
2. **Backpressure**: RabbitMQ acts as the buffer. If the database layer slows down, the queue absorbs the spikes. The FastAPI producer remains completely unblocked, maintaining high throughput.
3. **Processing (Async Worker)**: Consumes messages from RabbitMQ. It uses Redis to implement debouncing (e.g., grouping 100 signals from the same component within 10s into a single Work Item).
4. **Storage**: High-volume raw signals are dumped asynchronously into MongoDB, avoiding relational locks. Structured lifecycle data is transactional and stored in PostgreSQL.

## How to Run

1. **Start Infrastructure**:
   ```bash
   docker-compose up -d
   ```
   *Note: This starts PostgreSQL, MongoDB, Redis, and RabbitMQ.*

2. **Start Backend**:
   Ensure you have Python 3 installed.
   ```bash
   cd backend
   pip install -r requirements.txt
   
   # Run the API server
   uvicorn app.main:app --reload
   
   # Run the Async Worker (in a separate terminal)
   python -m app.worker
   ```

3. **Start Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Simulating Signals
You can use the provided script to simulate a high-volume failure event.
```bash
cd backend
python scripts/mock_signals.py
```
This will send 100 signals for a cache component (debounced to 1 work item) and a critical database failure.

## Endpoints
- `GET /health`: Healthcheck.
- `POST /api/v1/signals`: Ingest signal.
- `GET /api/v1/incidents`: List incidents.
- `GET /api/v1/incidents/{id}`: Incident details.
- `POST /api/v1/incidents/{id}/rca`: Submit RCA and close incident.
