#  Incident Management System (IMS)

A **production-grade, high-throughput Incident Management System** built to ingest, debounce, and manage massive volumes of application error signals. The system is architected to sustain bursts of **10,000+ signals/sec** without overwhelming the persistence layer, using an event-driven, fully decoupled microservices design — all orchestrated with a single `docker compose up` command.

---

## 🏗️ What Was Built — Project Journey

This project went through multiple major upgrades from a basic prototype to a fully production-ready system:

| Version | What Changed |
|---|---|
| v1 — Prototype | Single FastAPI + RabbitMQ + Redis + PostgreSQL setup |
| v2 — Kafka Migration | Replaced RabbitMQ with Apache Kafka for higher throughput |
| v3 — Cluster Upgrade | Upgraded from a single Kafka broker to a **3-node KRaft Kafka cluster** (no Zookeeper) |
| v4 — Load Balancing | Added **Nginx reverse proxy** to load balance across **3 replicated backend** instances |
| v5 — Cross-Platform | Fixed Confluent Kafka `exec format error` on ARM/Kali by migrating to `apache/kafka:3.7.0` (multi-arch) |
| v6 — Windows Port | Full migration from Linux/Kali to **Windows + Docker Desktop** environment |
| v7 — UI Refinement | Centred IMS branding, expanded abbreviation, removed guard icon, polished dashboard |

---

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

## 📁 Project Structure

```
Zeotap/
├── docker-compose.yml          # Full stack orchestration
├── README.md
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py             # FastAPI app, lifespan, throughput metrics
│       ├── config.py           # Pydantic settings (env-driven config)
│       ├── ingestion.py        # POST /ingest → rate limit → Kafka publish
│       ├── routes.py           # GET/POST incidents, state transitions, RCA
│       ├── worker.py           # Kafka consumer → debounce → DB writes
│       ├── models/
│       │   ├── db.py           # Async SQLAlchemy engine + MongoDB client
│       │   └── schema.py       # WorkItem + RCA SQLAlchemy ORM models
│       └── patterns/
│           ├── state.py        # State Pattern: lifecycle enforcement
│           └── strategy.py     # Strategy Pattern: severity-based alerting
│   └── scripts/
│       └── mock_signals.py     # Load test: fires 10,000 signals at the API
│
├── frontend/
│   ├── Dockerfile
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx             # Root: routing between Dashboard and Detail view
│       ├── index.css           # Glassmorphism dark theme, custom utilities
│       └── components/
│           ├── Dashboard.jsx   # Live incident list with metric cards, auto-refresh
│           ├── IncidentDetail.jsx  # Single incident view with raw signals + state controls
│           └── RCAForm.jsx     # Mandatory RCA submission form (blocks CLOSE)
│
└── nginx/
    ├── backend.conf            # Upstream: fastapibackend → 3 backend replicas
    └── frontend.conf           # Frontend proxy config
```

---

## 💻 How to Run (Windows / macOS / Linux)

This application is fully Dockerized. The **only prerequisite** is [Docker Desktop](https://www.docker.com/products/docker-desktop/).

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Zeotap
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

---

## 🔌 API Endpoints

All API endpoints are served under `/api/v1/`.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/ingest` | Ingest a raw error signal. Returns `202 Accepted`. |
| `GET` | `/api/v1/incidents` | List all incidents (work items) ordered by newest first. |
| `GET` | `/api/v1/incidents/{id}` | Get a single incident with its raw signals from MongoDB and RCA. |
| `POST` | `/api/v1/incidents/{id}/state` | Transition incident state (`OPEN` → `INVESTIGATING` → `RESOLVED` → `CLOSED`). |
| `POST` | `/api/v1/incidents/{id}/rca` | Submit Root Cause Analysis. Automatically closes the incident. |
| `GET` | `/health` | Health check endpoint. |

### Signal Payload (POST `/ingest`)

```json
{
  "component_id": "CACHE_CLUSTER_01",
  "severity": "P0",
  "payload": {
    "error": "Connection refused",
    "host": "10.0.1.5"
  },
  "timestamp": 1714600000.0
}
```

---

## 🗄️ Verifying Data Persistence

### Check PostgreSQL (Incidents & RCA)
```bash
docker compose exec postgres psql -U ims_user -d ims_db -c "SELECT id, component_id, state, severity FROM work_items ORDER BY id DESC LIMIT 10;"
```

### Check MongoDB (Raw Signals)
```bash
docker compose exec mongodb mongosh -u root -p example_password --authenticationDatabase admin ims_raw --eval "db.signals.find().limit(5).pretty()"
```

### Check Redis (Debounce Keys)
```bash
docker compose exec redis redis-cli KEYS "debounce:*"
```

---

## 🔧 Kafka Cluster Details

The system uses a **3-broker Apache Kafka 3.7.0 cluster in KRaft mode** (no Zookeeper dependency):

- `kafka1:9092` — Broker 1
- `kafka2:9092` — Broker 2
- `kafka3:9092` — Broker 3

**Replication factor: 3**, **Min ISR: 2** — meaning the cluster can tolerate losing one broker without data loss.

> ℹ️ **Why `apache/kafka:3.7.0` instead of Confluent?** The Confluent Platform image (`confluentinc/cp-kafka`) is only built for `linux/amd64`. Using `apache/kafka` provides a multi-architecture image that works natively on both `ARM64` (Apple Silicon, some Linux machines) and `x86_64` without emulation, eliminating the `exec format error`.

---

## 📊 Live Dashboard Features

- **Metric Cards** — Total incidents, critical open count, total closed count
- **Active Alerts Tab** — Shows all `OPEN`, `INVESTIGATING`, and `RESOLVED` incidents
- **Closed Tickets Tab** — Historical view of resolved incidents
- **Auto-refresh** — Polls the API every **3 seconds** for live updates
- **Incident Detail View** — Full timeline, raw signals from MongoDB, state transition controls, and RCA submission form
- **Severity Badges** — Color-coded P0 (red), P1 (amber), P2 (blue)
- **State Badges** — Color-coded lifecycle status with enforced transition rules

---

## ⚠️ Known Constraints & Design Decisions

- **Rate Limit**: The API enforces a global rate limit of **15,000 signals/sec** using a Redis counter with a 1-second TTL. Requests beyond this threshold receive `HTTP 429`.
- **Debounce Window**: Identical `component_id` signals within **10 seconds** are collapsed into a single WorkItem. This is configurable in `worker.py`.
- **RCA Enforcement**: The State Pattern in `state.py` physically prevents the `CLOSED` transition without a complete RCA. This is a hard constraint — not UI-only.
- **Worker Scaling**: Currently a single worker instance. For higher throughput, multiple worker replicas with Kafka consumer groups can be added.
