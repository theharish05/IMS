# IMS - Incident Management System

A mission-critical Incident Management System designed to ingest, debounce, and manage high-volume application error signals. This project implements a modern, decoupled architecture capable of sustaining bursts of 10,000 signals/sec without crashing the persistence layer.

## 🚀 Tech Stack

### Backend
* **FastAPI**: Provides a high-performance, asynchronous REST API for signal ingestion and UI data serving. It was chosen because of its native `asyncio` support and speed.
* **Kafka (Broker)**: Acts as the "Waiting Room" (Message Queue) to absorb massive bursts of incoming errors. This provides backpressure so the database is never overwhelmed.
* **Python Async Worker**: A background service that consumes Kafka messages asynchronously, runs the Debouncing Logic, and writes structured incidents to the databases.

### Databases (Polyglot Persistence)
* **Redis**: Used as an ultra-fast in-memory cache to debounce identical signals within a 10-second window, and handles API rate-limiting to prevent DDoS attacks.
* **MongoDB**: Acts as the Data Lake. It captures every single raw, unstructured JSON error payload instantly for auditing and telemetry viewing. Chosen because NoSQL databases excel at high-volume write operations.
* **PostgreSQL**: Acts as the strict Source of Truth. It stores the official Incident Work Items and Root Cause Analysis (RCA) records transactionally. Chosen because it guarantees ACID compliance for business logic.

### Frontend
* **React + Vite**: A lightning-fast Single Page Application.
* **Tailwind CSS v4**: For the high-end, modern "Linear/Vercel" aesthetic, dark mode styling, and responsive layout.

## 🏗️ Architecture & Backpressure Handling

In a traditional system, an API hitting an RDBMS directly will crash when receiving 10,000 requests per second. 
To achieve true resilience, this system implements **Backpressure**:
1. **Ingestion**: FastAPI receives thousands of signals but does *not* write them to the DB. It simply publishes them to Kafka and immediately returns `202 Accepted`.
2. **Debouncing**: The Kafka worker reads these messages in the background. It uses Redis to detect if multiple identical signals (e.g., `CACHE_CLUSTER_01` failure) arrived within the last 10 seconds.
3. **Persisting**: If 100 identical signals arrive, the worker ignores 99 of them, creates just ONE "Work Item" in PostgreSQL, but saves all 100 raw payloads to MongoDB for auditing.

## 💻 How to Run (Linux, Mac, or Windows)

This application is fully Dockerized. It will run perfectly on Linux, MacOS, or Windows without installing any dependencies locally other than Docker Desktop.

### 1. Start the entire stack
Open your terminal and run the following command from the root directory:
```bash
docker compose up --build -d
```
*This single command starts Kafka (in KRaft mode), Redis, PostgreSQL, MongoDB, the FastAPI backend, the async Worker, and the React Frontend.*

### 2. Access the UI
Open your browser and navigate to:
```
http://localhost:5173
```

### 3. Simulate a 10,000 Signal Burst
To prove the system's resilience and debouncing logic, execute the mock script:
```bash
docker compose exec backend python scripts/mock_signals.py
```
*Watch the React dashboard dynamically group these 10,000 incoming errors into a few actionable incidents!*


## 🔒 Design Patterns Used
* **Strategy Pattern**: Determines incident severity and routing logic based on signal payload dynamically.
* **State Pattern**: Enforces strict lifecycle transitions (`OPEN` -> `CLOSED`). It physically blocks an incident from being closed unless a complete RCA is submitted, ensuring accountability.

## 📝 Recent Updates
* **Architectural Simplification**: Migrated from Zookeeper to Apache Kafka in KRaft mode for better cross-platform compatibility and a lighter footprint.
* **UI Refinements**: Streamlined the header by replacing the generic shield icon with the fully expanded "Incident Management System" branding for a more professional look.
