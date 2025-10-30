PROMPT.md — Cloudflare FastAPI Modular Worker Scaffold

You are Claude Code / Codex, operating in the repo core-tessie-api.
Use the official FastAPI support in Python Workers and the examples in cloudflare/python-workers-examples, adhering to the technical constraints from the Cloudflare documentation.
Build a modular FastAPI application deployed as a Python Worker with the following requirements:

📏 Technical Constraints (from Cloudflare Docs)

Async Only: The runtime is single-threaded. Modules like threading, multiprocessing, and sockets are not functional. All I/O must be asynchronous.
Package Management: Dependencies are managed by pywrangler via pyproject.toml, not cf-requirements.txt.
HTTP Client: Outbound HTTP requests must use a supported async library, such as aiohttp or httpx.
Environment Access: FastAPI endpoints access environment bindings (env) via the request.scope["env"] dictionary.

🧩 Core Goals

Provide a typed FastAPI API for:
/d1/* CRUD + LIST endpoints (auto-filters, pagination, sort).
/tessieapi/* proxy to Tessie endpoints.
/colbycommands/* curated “well-lit” commands (energy report, etc).
/agent/* chat + action interfaces (Cloudflare Agents SDK + Actors + Workflows + Queues).
/openapi.json and /openapi.yaml.
/ws (WebSocket) + /events (SSE fallback).
Sync Tessie data to D1 every 4 hours (cron) and record verbose logs in D1 for full traceability.
Support CORS, Workers AI binding, Queue producer, and Analytics Engine telemetry.

⚙️ Project Structure




src/
 ├── main.py                # WorkerEntrypoint w/ FastAPI ASGI hook + cron handler
 ├── app.py                 # FastAPI app factory, routers registration
 ├── config.py              # env vars, defaults, CORS_ALLOWED_ORIGINS
 ├── d1/
 │    ├── client.py         # thin async D1 client using env.DB.prepare().run()
 │    └── queries.py        # reusable SQL statements
 ├── models/
 │    ├── vehicle.py        # Vehicle, Charge, Drive, Climate, Software schemas
 │    ├── log.py            # LogRow
 │    ├── agent.py          # AgentMessage, AgentAction
 │    └── tessie.py         # Tessie DTOs
 ├── routers/
 │    ├── d1_ops.py
 │    ├── tessie_proxy.py
 │    ├── colby_commands.py
 │    ├── agent_ops.py
 │    └── openapi.py
 ├── services/
 │    ├── tessie.py         # proxy + auth + rate-limit (using aiohttp)
 │    ├── energy.py         # custom report logic
 │    ├── ai.py             # Workers AI chat/completion helpers
 │    ├── logging.py        # D1 logging middleware
 │    ├── queue.py          # send / receive handlers
 │    └── cors.py           # CORS injection helpers
 └── ws/
      ├── websocket.py
      └── sse.py
migrations/
 └── 0001_init.sql
pyproject.toml
wrangler.toml



🗃️ migrations/0001_init.sql

Create these tables:
vehicles, vehicle_settings, charges, drives, climates, software_updates
tessie_raw, sync_runs, energy_reports
logs (verbose log storage)
agent_messages, agent_actions
Each table: id TEXT PRIMARY KEY, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP.
logs must include route, actor, request_id, level, message, payload JSON.

🧠 Agent / AI Integration

Bind WORKERS_AI (use env.WORKERS_AI.run(model, input)).
Expose /agent/chat → streams tokens to /ws or /events, logs to agent_messages.
/agent/actions → enqueue into CORE_TESSIE_QUEUE and log to agent_actions.
Use Cloudflare Agents SDK + Actors + Workflows if available in the environment.

🔁 Tessie Proxy

/tessieapi/{vin}/{path:path} mirrors Tessie REST.
Implement all outbound requests using the aiohttp client, as it is supported in the Python Workers runtime.
Inject TESSIE_API_KEY from env.
Store raw responses into tessie_raw and logs.

⚡ ColbyCommands

/colbycommands/energy-report — summarize Tessie telemetry and persist to energy_reports.
Extendable /colbycommands/* for other curated routines.

🔄 Cron Handler

Every 4 hours (0 */4 * * *):
Log sync_runs start.
Pull all vehicles from D1.
Fetch Tessie data, insert normalized rows, append to tessie_raw + logs.
Summarize → sync_runs.status = "succeeded".

🌐 CORS / OpenAPI / WebSocket

Use CORS_ALLOWED_ORIGINS env.
Implement OPTIONS preflights and append headers to all responses.
Serve /openapi.json and /openapi.yaml using app.openapi() + PyYAML.
/ws for live events; /events as SSE fallback.

📦 Packaging (pyproject.toml)

Use this pyproject.toml to manage dependencies via pywrangler.

Ini, TOML


[project]
name = "core-tessie-api"
version = "0.1.0"
description = "FastAPI-based Python Worker for Tessie data and AI agents."
requires-python = ">=3.12"
dependencies = [
    "fastapi==0.109.0",
    "starlette==0.37.2",
    "pydantic==1.10.13",
    "PyYAML==6.0.2",
    "PyJWT==2.8.0",
    "python-dotenv==1.0.1",
    "aiohttp==3.9.5",
    "pytz==2025.1",
    "pytest-asyncio==0.23.8"
]

[dependency-groups]
dev = ["workers-py"]



⚙️ Configuration (wrangler.toml)

Generate this wrangler.toml to define bindings, crons, and queues.

Ini, TOML


name = "core-tessie-api"
main = "src/main.py:Default"
compatibility_date = "2025-10-30"
compatibility_flags = ["python_workers"]

# Cron trigger for the 4-hour sync
[triggers]
crons = ["0 */4 * * *"]

# Environment variable bindings (for FastAPI)
[vars]
CORS_ALLOWED_ORIGINS = "http://localhost:3000,https://your-prod-domain.com"

# Secrets (for WorkerEntrypoint)
# npx wrangler secret put TESSIE_API_KEY
# npx wrangler secret put JWT_SECRET_KEY

# D1 Database binding
[[d1_databases]]
binding = "DB"
database_name = "tessie-db"
database_id = "<your-d1-db-id>"

# Workers AI binding
[ai]
binding = "WORKERS_AI"

# Queue producer binding
[[queues.producers]]
queue = "core-tessie-queue"
binding = "CORE_TESSIE_QUEUE"

# Queue consumer (if this worker also consumes)
[[queues.consumers]]
queue = "core-tessie-queue"



🧠 Implementation Pattern (WorkerEntrypoint)

Use this pattern in src/main.py to bridge the Worker runtime to the FastAPI app.

Python


from workers import WorkerEntrypoint
from fastapi import FastAPI, Request
from js import console
import asgi

from src.app import create_app
from src.services.logging import log_request
from src.services.sync import run_sync

# Create the FastAPI app instance
app = create_app()

class Default(WorkerEntrypoint):
    """
    WorkerEntrypoint bridges Cloudflare's runtime with the FastAPI
    ASGI application. It handles 'fetch' (HTTP) and 'queue' events.
    The 'env' (self.env) is passed to asgi.fetch, making it
    available in FastAPI via request.scope["env"].
    """

    async def fetch(self, request, env):
        """
        Handles incoming HTTP requests.
        Detects 'cf-cron' header for scheduled tasks.
        Passes all other requests to the FastAPI app.
        """
        # Detect cron-triggered fetches
        if request.headers.get("cf-cron", ""):
            console.log("Cron triggered: running sync")
            await run_sync(env)
            return Response.json({"status": "sync complete"})
        
        try:
            # Pass the request, and *critically* the env, to the ASGI app
            response = await asgi.fetch(app, request, env)
        except Exception as e:
            # Catch-all for ASGI app errors
            console.error(f"ASGI app error: {e}")
            response = Response.json({"error": str(e)}, status=500)

        # Log the request/response pair to D1
        try:
            await log_request(request, response, env)
        except Exception as log_e:
            # Failsafe: don't block the response if logging fails
            console.error(f"Failed to log request: {log_e}")
            
        return response

    async def queue(self, batch, env):
        """
        Handles messages from the CORE_TESSIE_QUEUE.
        """
        for msg in batch.messages:
            console.log(f"Queue message received: {msg.id}")
            # Add your queue processing logic from services/queue.py here
            # e.g., await handle_queue_message(msg, env)
            msg.ack()

# ---
# Note for FastAPI Routers (e.g., src/routers/ai_ops.py):
# ---
# To access bindings, use the request.scope:
#
# from fastapi import APIRouter, Request
#
# router = APIRouter()
#
# @router.post("/chat")
# async def chat(request: Request, prompt: str):
#     env = request.scope["env"]
#     ai_binding = env.WORKERS_AI
#     d1_binding = env.DB
#
#     # Use bindings
#     response = await ai_binding.run(model, {"prompt": prompt})
#     await d1_binding.prepare("...").run()
#
#     return response
#



✅ Acceptance

Deploys with uv run pywrangler deploy (requires pip install uv and uv venv).
/openapi.json|yaml are live and valid.
/d1/logs/list returns logs.
/agent/chat streams responses using Workers AI.
Cron sync persists telemetry and verbose logs.
All endpoints respond with CORS headers.
Fully typed Pydantic models and ASGI compliant.

Deliverables

Full modular FastAPI Worker codebase following this structure.
migrations/0001_init.sql exactly as above.
pyproject.toml as specified.
wrangler.toml as specified.
Inline docstrings explaining WorkerEntrypoint ↔ ASGI bridging, D1 operations, Queue, and AI usage (as shown in the Implementation Pattern).
