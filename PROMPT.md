PROMPT — Build Modular FastAPI-Style Python Worker for Tessie + D1 + Agents

You are an expert engineer working in Cloudflare Workers (Python runtime via Pyodide).
Create a modular, production-ready codebase with FastAPI-style routing and Pydantic-like validation, but pin libraries compatible with Pyodide (no native extensions). If FastAPI v2/pydantic v2 cause issues, use FastAPI 0.95.x + Pydantic 1.10.x + Starlette 0.27.x.

High-Level Requirements
	1.	Python Worker with a FastAPI-style app and modular routers:
	•	/d1/* — CRUD, especially robust LIST with filter + pagination + sorting across all tables.
	•	/agent/* — chat + actions backed by Workers AI, Queues, Durable Object (via JS companion if needed), Workflows. Expose invoke, status, events.
	•	/tessieapi/* — raw Tessie API proxy (path-through, auth, rate-limit).
	•	/colbycommands/* — curated commands (e.g., energy-report) with business logic.
	•	/openapi.json and /openapi.yaml (generate schema dynamically).
	•	/ws WebSocket endpoint for real-time agent/events; must include SSE fallback at /events if WebSockets are limited in Python Workers.
	2.	Type validation / “ORM” layer using Pydantic v1 models (no compiled deps) for:
	•	Car/Vehicle info to sync (vehicles, charges, drives, climate, software, etc.).
	•	Request/response DTOs for Tessie proxy and ColbyCommands.
	•	D1 row mappers.
	3.	D1 schema + migrations:
	•	Provide migrations/0001_init.sql that creates:
	•	vehicles, vehicle_settings, charges, drives, climates, software_updates
	•	tessie_raw (raw JSON per pull), sync_runs (each cron run),
logs (verbose), energy_reports, agent_messages, agent_actions
	•	All tables include id, created_at, updated_at; logs capture request_id, route, actor, level, message, payload.
	4.	CORS support using CORS_ALLOWED_ORIGINS var; respond to OPTIONS and attach headers on all routes.
	5.	Cron (every 4 hours) to pull Tessie state and persist to D1 (with row-level logs and a sync_runs record).
	6.	Queues:
	•	Producer for CORE_TESSIE_QUEUE on long-running/async tasks (e.g., bulk energy report).
	•	Consumer handler (in this Python worker if possible; if not feasible, document a JS Consumer Worker and POST bridge).
	7.	Workers AI:
	•	Bind WORKERS_AI, expose /agent/chat that:
	•	Streams tokens to /ws (or /events) and persists messages to agent_messages.
	•	Supports tools/actions that enqueue tasks and write agent_actions.
	8.	OpenAPI:
	•	Ensure app.openapi() is correct.
	•	Serve /openapi.json and /openapi.yaml (generate YAML from JSON at runtime).
	9.	Logging:
	•	Middleware to log every request and response (status, duration, user/subject, headers*, body*) into logs.
	•	Add safeguards to avoid storing secrets; redact headers/body fields (Authorization, api_key, jwt, etc).
	10.	Package pins (Pyodide-friendly) via cf-requirements.txt:

fastapi==0.95.2
starlette==0.27.0
pydantic==1.10.13
PyYAML==6.0.2
PyJWT==2.8.0
python-dotenv==1.0.1
aiohttp==3.9.5
pytz==2025.1
pytest-asyncio==0.23.8

If any import fails in Pyodide, provide a minimal Starlette-only fallback keeping the same public API.

⸻

Project Layout

core-tessie-api/
├─ wrangler.toml
├─ cf-requirements.txt
├─ migrations/
│  └─ 0001_init.sql
├─ src/
│  ├─ main.py                 # Worker entry + CORS + cron + queue + websocket/SSE
│  ├─ app.py                  # FastAPI app creation + OpenAPI wiring
│  ├─ config.py               # env/vars (CORS_ALLOWED_ORIGINS, SYNC_INTERVAL_HOURS, etc.)
│  ├─ d1/
│  │  ├─ client.py            # thin D1 client (HTTP bridge if needed), helpers
│  │  ├─ queries.py           # parameterized SQL for LIST/CRUD per table
│  ├─ models/
│  │  ├─ base.py              # Pydantic BaseModel settings (v1)
│  │  ├─ vehicle.py           # Vehicle/Car models (Vehicle, Charge, Drive, Climate, SoftwareUpdate)
│  │  ├─ log.py               # LogRow
│  │  ├─ agent.py             # AgentMessage, AgentAction
│  │  └─ tessie.py            # Tessie proxy DTOs
│  ├─ routers/
│  │  ├─ openapi.py           # /openapi.json, /openapi.yaml
│  │  ├─ d1_ops.py            # /d1/<table> list/create/get/update/delete + filters
│  │  ├─ agent_ops.py         # /agent/chat, /agent/actions, /agent/events
│  │  ├─ tessie_proxy.py      # /tessieapi/* passthrough
│  │  └─ colby_commands.py    # /colbycommands/energy-report etc.
│  ├─ services/
│  │  ├─ tessie.py            # auth, rate-limit, fetch/wrap
│  │  ├─ energy.py            # energy report logic
│  │  ├─ logging.py           # structured logging to D1
│  │  ├─ cors.py              # helpers to attach CORS headers
│  │  ├─ ai.py                # Workers AI invocations
│  │  └─ queue.py             # producer/consumer handlers
│  └─ ws/
│     ├─ websocket.py         # /ws handler
│     └─ sse.py               # /events fallback (Server-Sent Events)
└─ tests/
   └─ test_endpoints.py


⸻

Migrations — migrations/0001_init.sql

-- vehicles & settings
CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  vin TEXT UNIQUE NOT NULL,
  display_name TEXT,
  make TEXT,
  model TEXT,
  year INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicle_settings (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(vehicle_id, key),
  FOREIGN KEY(vehicle_id) REFERENCES vehicles(id)
);

-- telemetry/state slices
CREATE TABLE IF NOT EXISTS charges (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  battery_level INTEGER,
  charge_rate REAL,
  charging_state TEXT,
  raw JSON,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(vehicle_id) REFERENCES vehicles(id)
);

CREATE TABLE IF NOT EXISTS drives (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  odometer REAL,
  latitude REAL,
  longitude REAL,
  speed REAL,
  raw JSON,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(vehicle_id) REFERENCES vehicles(id)
);

CREATE TABLE IF NOT EXISTS climates (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  interior_temp REAL,
  exterior_temp REAL,
  is_auto BOOLEAN,
  raw JSON,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(vehicle_id) REFERENCES vehicles(id)
);

CREATE TABLE IF NOT EXISTS software_updates (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  version TEXT,
  status TEXT,
  raw JSON,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(vehicle_id) REFERENCES vehicles(id)
);

-- raw pulls & sync runs
CREATE TABLE IF NOT EXISTS tessie_raw (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT,
  endpoint TEXT NOT NULL,
  status INTEGER,
  payload JSON,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(vehicle_id) REFERENCES vehicles(id)
);

CREATE TABLE IF NOT EXISTS sync_runs (
  id TEXT PRIMARY KEY,
  started_at TEXT DEFAULT CURRENT_TIMESTAMP,
  finished_at TEXT,
  status TEXT,
  summary TEXT
);

-- verbose logs (full traceability)
CREATE TABLE IF NOT EXISTS logs (
  id TEXT PRIMARY KEY,
  level TEXT NOT NULL,
  route TEXT,
  request_id TEXT,
  actor TEXT,
  message TEXT,
  payload JSON,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- energy reports
CREATE TABLE IF NOT EXISTS energy_reports (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  period_start TEXT,
  period_end TEXT,
  summary JSON,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(vehicle_id) REFERENCES vehicles(id)
);

-- agent I/O
CREATE TABLE IF NOT EXISTS agent_messages (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,         -- user|assistant|system|tool
  content TEXT NOT NULL,
  metadata JSON,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agent_actions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL,       -- queued|running|succeeded|failed
  input JSON,
  result JSON,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);


⸻

Implementation Notes & Constraints
	•	ASGI on Workers Python: If full FastAPI can’t boot in Pyodide, deliver a Starlette app with identical routes and DTOs. Keep the same public contract.
	•	Websocket: If native WS is not available, implement SSE at /events and a thin WS shim (document limitations).
	•	D1 Client: Expose a d1.client with helpers:
	•	execute(sql, params) returning rows, meta
	•	list(table, filters: dict, limit, offset, sort) with whitelist of tables/columns to avoid SQL injection.
	•	OpenAPI:
	•	GET /openapi.json → return app.openapi()
	•	GET /openapi.yaml → JSON→YAML with PyYAML.safe_dump
	•	CORS:
	•	Read CORS_ALLOWED_ORIGINS.
	•	Respond to OPTIONS with Access-Control-* headers.
	•	Attach CORS headers on all responses.

⸻

Endpoints (Required)

D1 Operations — /d1/*
	•	GET /d1/{table}/list?filter[k]=v&sort=field,-field2&limit=50&offset=0
	•	GET /d1/{table}/{id}
	•	POST /d1/{table} (create)
	•	PATCH /d1/{table}/{id}
	•	DELETE /d1/{table}/{id}

Tessie Proxy — /tessieapi/*
	•	Mirror Tessie REST surface. Example:
	•	POST /tessieapi/{vin}/command/{name}
	•	GET /tessieapi/{vin}/state/{slice}
	•	Inject Tessie auth from secret; log to tessie_raw and logs.

ColbyCommands — /colbycommands/*
	•	POST /colbycommands/energy-report
Input: { vin, range: {start, end} }
Output: computed report + row in energy_reports.

Agent Ops — /agent/*
	•	POST /agent/chat → streams via /ws or /events and writes to agent_messages.
	•	POST /agent/actions → enqueues long tasks to Queues (CORE_TESSIE_QUEUE), row in agent_actions.
	•	GET /agent/actions/{id} → status/result.

OpenAPI
	•	GET /openapi.json
	•	GET /openapi.yaml

Realtime
	•	GET /ws (WebSocket) with SSE fallback at GET /events.

Health
	•	GET /healthz → { ok: true, time, version }

⸻

Cron & Sync
	•	Register a cron handler (every 4 hours) that:
	•	Starts a sync_runs row.
	•	Pulls Tessie states for all vehicles.
	•	Writes normalized slices (charges, drives, climates, software_updates) and raw responses to tessie_raw.
	•	Writes verbose logs at each step.
	•	Marks sync_runs.status = succeeded|failed.

⸻

Queues
	•	Producer: In /agent/actions and /colbycommands/energy-report when work > threshold.
	•	Consumer: Provide a Python handler; if Python Workers cannot consume directly, document and generate a JS consumer worker (Durable Object/Actor/Workflow friendly) receiving messages and calling back into Python API.

⸻

Workers AI
	•	Use the WORKERS_AI binding to:
	•	Summarize sync runs.
	•	Provide agent chat completions (stream to WS/SSE).
	•	Store every prompt/response in agent_messages.

⸻

Code Stubs (Minimal)

src/app.py

from fastapi import FastAPI
from routers import openapi as r_openapi, d1_ops, tessie_proxy, colby_commands, agent_ops

def create_app() -> FastAPI:
    app = FastAPI(title="Core Tessie API", version="0.1.0")
    app.include_router(r_openapi.router)
    app.include_router(d1_ops.router, prefix="/d1", tags=["d1"])
    app.include_router(tessie_proxy.router, prefix="/tessieapi", tags=["tessie"])
    app.include_router(colby_commands.router, prefix="/colbycommands", tags=["colby"])
    app.include_router(agent_ops.router, prefix="/agent", tags=["agent"])
    return app

app = create_app()

src/routers/openapi.py

from fastapi import APIRouter, Response
import yaml
from src.app import create_app

router = APIRouter()

@router.get("/openapi.json")
def openapi_json():
    return create_app().openapi()

@router.get("/openapi.yaml", response_class=Response, responses={200: {"content": {"application/yaml": {}}}})
def openapi_yaml():
    spec = create_app().openapi()
    return Response(yaml.safe_dump(spec), media_type="application/yaml")

src/routers/d1_ops.py (sketch)

from fastapi import APIRouter, Query
from src.d1.client import list_rows, get_row, create_row, update_row, delete_row

router = APIRouter()

@router.get("/{table}/list")
async def list_table(table: str,
                     limit: int = Query(50, ge=1, le=500),
                     offset: int = Query(0, ge=0),
                     sort: str | None = None,
                     filter: dict | None = None):
    return await list_rows(table, filter or {}, limit, offset, sort)

@router.get("/{table}/{id}")
async def get_table_row(table: str, id: str):
    return await get_row(table, id)

@router.post("/{table}")
async def create_table_row(table: str, payload: dict):
    return await create_row(table, payload)

@router.patch("/{table}/{id}")
async def update_table_row(table: str, id: str, payload: dict):
    return await update_row(table, id, payload)

@router.delete("/{table}/{id}")
async def delete_table_row(table: str, id: str):
    return await delete_row(table, id)

src/routers/tessie_proxy.py (sketch)

from fastapi import APIRouter, Request
from src.services.tessie import forward

router = APIRouter()

@router.api_route("/{path:path}", methods=["GET","POST","PUT","PATCH","DELETE"])
async def passthrough(path: str, request: Request):
    return await forward(path, request)

src/routers/agent_ops.py (sketch)

from fastapi import APIRouter
from src.services.ai import chat_stream
from src.services.queue import enqueue_action

router = APIRouter()

@router.post("/chat")
async def agent_chat(payload: dict):
    # stream via WS/SSE and persist to agent_messages
    return await chat_stream(payload)

@router.post("/actions")
async def agent_action(payload: dict):
    return await enqueue_action(payload)

src/main.py should:
	•	Instantiate the app from app.py
	•	Add CORS middleware (manual headers if middleware fails)
	•	Expose handlers for:
	•	HTTP fetch → route to app
	•	Cron event → call sync function
	•	Queue consumer event → process messages
	•	WebSocket /ws + SSE /events (if WS not available, keep SSE only)
	•	Ensure every request/response is logged to D1 (redacted).

⸻

Acceptance Criteria
	•	wrangler deploy succeeds with cf-requirements.txt pins above.
	•	GET /openapi.json and GET /openapi.yaml both work and reflect all routes.
	•	GET /d1/logs/list?limit=10 returns recent log rows.
	•	POST /agent/chat returns a stream and writes agent_messages.
	•	POST /colbycommands/energy-report creates an energy_reports row.
	•	POST /tessieapi/{vin}/command/honk_horn proxies to Tessie and stores raw in tessie_raw.
	•	Cron (every 4 hours) writes a sync_runs row and persists slices to charges, climates, etc.
	•	All endpoints return proper CORS headers for allowed origins.

⸻

TODO (Baseline Assets — fail build if missing)
	•	cf-requirements.txt with pinned versions (above)
	•	migrations/0001_init.sql as specified
	•	src/d1/client.py with execute, list_rows, create_row, update_row, delete_row
	•	src/services/logging.py logging every request/response to D1
	•	src/routers/* implemented for all surfaces (d1_ops, agent_ops, tessie_proxy, colby_commands, openapi)
	•	/ws and /events implemented (SSE fallback)
	•	Queue producer + (if needed) JS consumer documented for Durable Object/Workflows bridge
	•	Redaction policy in logger (Authorization, tokens, secrets)

⸻

Deliver the full codebase, ready to deploy, with helpful inline comments where Cloudflare Python limitations require workarounds (e.g., WS, DO/Agents SDK).
