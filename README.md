#  Incident Management System (IMS)

A **production-grade, high-throughput Incident Management System** built to ingest, debounce, and manage massive volumes of application error signals. The system is architected to sustain bursts of **10,000+ signals/sec** without overwhelming the persistence layer, using an event-driven, fully decoupled microservices design — all orchestrated with a single `docker compose up` command.


## 🚀 Tech Stack
### Backend
| Tool | Role |
|---|---|
| **FastAPI** | Async REST API for signal ingestion and UI data serving. Uses native `asyncio` for concurrency. |
| **Uvicorn** | ASGI server running the FastAPI app inside Docker (3 replicas). |
| **aiokafka** | Async Kafka producer (ingestion) and consumer (worker). |
| **SQLAlchemy (Async)** | ORM for async PostgreSQL access via `asyncpg`. |
| **motor** | Async MongoDB driver for raw signal storage. |
| **redis.asyncio** | Async Redis client for debouncing and rate limiting. |
| **pydantic / pydantic-settings** | Data validation and environment-based configuration. |

### Infrastructure & Messaging
| Tool | Role |
|---|---|
| **Apache Kafka 3.7.0 (KRaft mode)** | 3-node Kafka cluster acting as the message queue. **No Zookeeper required** — uses the built-in KRaft consensus protocol. Chosen for multi-arch compatibility (works on ARM64/x86_64). |
| **Nginx** | Reverse proxy and load balancer. Routes `/api/v1/*` to the backend cluster and `/` to the frontend. |
| **Docker Compose** | Orchestrates the entire stack: Kafka (×3), PostgreSQL, MongoDB, Redis, Backend (×3 replicas), Worker, Frontend, Nginx. |

### Databases (Polyglot Persistence)
| Database | Role |
|---|---|
| **Redis 7** | Ultra-fast in-memory cache for **10-second debounce windows** per component and per-second **rate limiting** (max 15,000 req/sec global). |
| **MongoDB 6** | Data lake. Stores every raw, unstructured JSON error payload for auditing and telemetry viewing. Excels at high-volume write workloads. |
| **PostgreSQL 15** | Source of truth. Stores structured `WorkItem` (incident) records and `RCA` entries transactionally with full ACID compliance. |

### Frontend
| Tool | Role |
|---|---|
| **React + Vite** | Lightning-fast SPA with hot-module replacement in development. |
| **Tailwind CSS** | Dark-mode, glassmorphism aesthetic inspired by Linear/Vercel design language. |
| **lucide-react** | Icon set for severity/state badges and component icons. |
| **date-fns** | Human-readable relative timestamps (e.g., "3 minutes ago"). |

---

## 🔬 Architecture & Data Flow

```
                              ┌─────────────────────────────────────┐
    Client / mock_signals.py  │           Nginx (Port 80)           │
    ──────────────────────►   │   Reverse Proxy + Load Balancer     │
                              └───────┬──────────────┬──────────────┘
                                      │              │
                              /api/v1/*         /  (frontend)
                                      │              │
                              ┌───────▼──────┐  ┌───▼──────────┐
                              │  FastAPI     │  │  React/Vite  │
                              │  (3 replicas)│  │  Frontend    │
                              └───────┬──────┘  └──────────────┘
                                      │
                              Rate Limit Check (Redis)
                                      │
                              ┌───────▼──────┐
                              │  Kafka       │  ← 3-node KRaft cluster
                              │  (3 brokers) │     (kafka1, kafka2, kafka3)
                              └───────┬──────┘
                                      │  signals_topic
                              ┌───────▼──────┐
                              │  Async       │
                              │  Worker      │
                              └──┬────────┬──┘
                                 │        │
                          Debounce?    New Incident?
                          (Redis)       (first signal)
                             │               │
                         link raw        ┌───▼──────────┐
                         signal      ──► │  PostgreSQL  │  ← WorkItem created
                             │           └──────────────┘
                             │
                    ┌────────▼───────┐
                    │    MongoDB     │  ← Every raw signal stored
                    └────────────────┘
```

### Backpressure & Debouncing Logic

In a naive system, a database hit per signal would crash under 10,000 req/sec. This system solves it with:

1. **Ingestion (FastAPI)** — Receives signals, checks Redis rate limit, then publishes to Kafka and immediately returns `202 Accepted`. The API never waits for DB writes.
2. **Debouncing (Worker + Redis)** — For each `component_id`, a Redis key with a **10-second TTL** is set on the first signal. If the same component fires again within 10 seconds, the worker skips creating a new incident and just links the raw signal to the existing `WorkItem`.
3. **Storage (Worker)** — If 100 identical signals arrive, only **1 WorkItem** is created in PostgreSQL, but **all 100 raw payloads** are stored in MongoDB for full audit traceability.

---

## 🏛️ Design Patterns

### State Pattern — `app/patterns/state.py`

Enforces strict **lifecycle transitions** for incidents:

```
OPEN  →  INVESTIGATING  →  RESOLVED  →  CLOSED
```

The `WorkItemStateContext` class physically **blocks** an incident from being `CLOSED` unless a complete RCA (Root Cause Analysis) has been submitted — with all three mandatory fields filled:
- `root_cause_category`
- `fix_applied`
- `prevention_steps`

This ensures **full accountability** before any incident can be marked done.

### Strategy Pattern — `app/patterns/strategy.py`

Dynamically selects the **alert escalation strategy** based on incident severity at runtime:

| Severity | Strategy | Action |
|---|---|---|
| `P0` | `P0Strategy` | Pages the on-call engineer immediately |
| `P1` | `P1Strategy` | Sends SMS notification |
| `P2` | `P2Strategy` | Posts alert to Slack channel |
| Default | `DefaultStrategy` | Logs for review |

---

## 💻 How to Run (Windows / macOS / Linux)

This application is fully Dockerized. The **only prerequisite** is [Docker Desktop](https://www.docker.com/products/docker-desktop/).

### 1. Clone the repository

```bash
git clone <your-repo-url>
```

### 2. Start the entire stack

```bash
docker compose up --build -d
```

This single command starts:
- `kafka1`, `kafka2`, `kafka3` — 3-node KRaft Kafka cluster
- `postgres` — PostgreSQL 15
- `mongodb` — MongoDB 6
- `redis` — Redis 7
- `backend` — **3 replicas** of the FastAPI app (Uvicorn)
- `worker` — Async Kafka consumer worker
- `frontend` — React + Vite SPA
- `nginx-lb` — Nginx reverse proxy (entry point on port 80)

### 3. Access the UI

Open your browser and navigate to:

```
http://localhost
```

> ℹ️ The Nginx proxy is the single entry point on port **80**. It routes API calls to the backend cluster and serves the frontend — no need to specify any port manually.

### 4. Simulate a 10,000 Signal Burst

To prove the system's resilience and debouncing logic, run the included mock script:

```bash
docker compose exec backend python scripts/mock_signals.py
```

Watch the dashboard dynamically group thousands of incoming raw signals into just a handful of deduplicated, actionable **Work Items**!
