# AGENTS.md  
**Core Tessie API — Agent Architecture & Operational Baselines**

This document defines the autonomous agents, their roles, dependencies, and operational standards that make up the **Core Tessie API** system.  
Every agent serves a specific function in managing the bridge between Cloudflare Workers, Tessie’s API, and authenticated vehicle automation.

---

## 🧩 Architecture Overview

The system is modularized around a set of “agents” — self-contained logical units responsible for distinct parts of the API flow:
- **Authentication & JWT Management**
- **API Communication (Requestors / Executors)**
- **Vehicle State Retrieval**
- **Command Execution**
- **Caching & Rate Throttling**
- **Error Monitoring**
- **Testing & Simulation**

Each agent must have:
- A clearly defined input/output contract.
- Robust error handling.
- Alignment with Worker deployment (Cloudflare).
- Automated testing coverage and fake-response fallbacks.

---

## ⚙️ Agent Definitions

### 1. JWT Token Issuer
**Purpose:**  
Generate and sign JWT tokens used by the Worker for authentication.

**Inputs**
- `JWT_SECRET` (env var)  
- Subject (`sub`) claim  
- Optional custom claims  
- Expiry duration  

**Outputs**
- Signed JWT (string)

**Failure Handling**
- Missing secret → fatal error with clear message  
- Invalid claims → validation error  

**Location**
`tessie_api/jwt_utils.py`

**Notes**
- Ensure Python runtime has `PyJWT` bundled in `cf-requirements.txt`.  
- Used by Worker Authenticator and CLI tools.

---

### 2. API Requestor
**Purpose:**  
Central handler for all outbound Tessie API HTTP requests.

**Inputs**
- `aiohttp.ClientSession`  
- API key or bearer token  
- VIN and endpoint params  

**Outputs**
- JSON response payloads  
- Normalized Python dicts or models  

**Failure Handling**
- Retries on transient network errors  
- Graceful propagation for 4xx/5xx  

**Location**
Modules under `tessie_api/` (`status.py`, `doors.py`, `charging.py`, etc.)

**Notes**
- Must include rate limiting hooks.  
- Consolidate repeated request logic here instead of per-module.

---

### 3. Worker Authenticator
**Purpose:**  
Validate inbound Worker requests, verify JWTs, enforce authorization.

**Inputs**
- `Authorization: Bearer <token>` header  
- `JWT_SECRET` env var  

**Outputs**
- Authenticated context (subject, roles, expiry, etc.)

**Failure Handling**
- Missing/invalid/expired token → HTTP 401/403  

**Location**
`src/main.py` and/or `tessie_api/jwt_utils.py`

**Notes**
- Ensure Worker name in `wrangler.toml` matches CI expectation (`core-tessie-api`).  
- Logs authentication outcomes for observability.

---

### 4. Vehicle State Fetcher
**Purpose:**  
Retrieve real-time or cached vehicle state (climate, battery, doors, etc.)

**Inputs**
- VIN(s)  
- API Requestor instance  
- Cache flag (optional)

**Outputs**
- Structured JSON state dicts  

**Failure Handling**
- Fallback to cached data if API fails  
- Log all partial failures  

**Location**
`tessie_api/historical_states.py`, `tessie_api/status.py`

**Notes**
- Must support both live and simulated (fake) modes.  
- Design to be compatible with future async scheduling agent.

---

### 5. Vehicle Command Executor
**Purpose:**  
Send commands to Tessie API (lock/unlock, honk, open trunk, etc.)

**Inputs**
- VIN  
- Command name + params  
- API Requestor  

**Outputs**
- Execution result JSON  
- Optional confirmation state  

**Failure Handling**
- Handle “vehicle asleep” gracefully with wake preflight  
- Return error with command context  

**Location**
`tessie_api/doors.py`, `tessie_api/charging.py`, etc.

**Notes**
- Should include wake retry pattern before issuing commands.  
- Consider batching support for fleet management.

---

### 6. Error Logger & Monitor
**Purpose:**  
Centralize structured logging, error capture, and optional alerting.

**Inputs**
- Exception objects  
- Agent context metadata  

**Outputs**
- Structured logs  
- Optional alerts  

**Failure Handling**
- Must never crash primary flow  
- Degrade gracefully on error  

**Location**
`tessie_api/utils.py` or dedicated `tessie_api/logging.py`

**Notes**
- Use Cloudflare Worker console or external telemetry (Sentry, R2 logs).  
- Include timestamped JSON logs.

---

### 7. Cache & Throttle Manager
**Purpose:**  
Prevent over-polling, redundant commands, or vehicle wake-ups.

**Inputs**
- Raw API responses  
- Metadata (timestamp, VIN, last action)  

**Outputs**
- Cached values  
- Throttle decisions  

**Failure Handling**
- Graceful degradation on cache miss  
- Enforce backoff under pressure  

**Location**
`tessie_api/state.py`, `tessie_api/historical_states.py`

**Notes**
- Implement TTL-based caching.  
- Consider D1 or KV for distributed cache persistence.

---

### 8. Test Harness Agent
**Purpose:**  
Enable offline development with fake responses and reproducible tests.

**Inputs**
- `TESSIE_USE_FAKE_RESPONSES=1`  
- `TESLA_VIN` (default fallback)  

**Outputs**
- Mocked state and command results  

**Failure Handling**
- Detect unintentional live calls and abort tests  

**Location**
`tests/`  

**Notes**
- Provide fixtures for common vehicle states.  
- Must run in both local and CI environments.

---

## 🔄 Agent Flow Summary

```text
Client → Worker Authenticator → Route Dispatch
    → (Fetch) Vehicle State Fetcher → Cache Manager → Response
    → (Command) Command Executor → API Requestor → Response
    → Error Logger monitors all paths


⸻

⚙️ Environment Variables

Variable	Description
JWT_SECRET	Secret key for JWT signing/verification
TESSIE_API_KEY	Auth key for Tessie API
TESSIE_USE_FAKE_RESPONSES	Enables offline/fake mode
TESLA_VIN	Default vehicle VIN for tests
CACHE_TTL	Cache duration (seconds)
WRANGLER_ENV	Cloudflare Worker environment
LOG_LEVEL	Info, Debug, or Error


⸻

📋 Expected Baseline Assets & TODOs

The following assets must exist in the repository for this architecture to function and stay maintainable.

✅ Configuration Baselines
	•	cf-requirements.txt must exist (not requirements.txt)
	•	wrangler.toml must define:
	•	main = "src/main.py"
	•	name = "core-tessie-api"
	•	compatibility_date pinned to current month

✅ Code Assets
	•	tessie_api/jwt_utils.py → implements JWT Token Issuer and Worker Authenticator helpers
	•	tessie_api/requestor.py → shared async HTTP client for Tessie API
	•	tessie_api/state.py → implements caching and fetch utilities
	•	tessie_api/commands.py → unified vehicle command executor
	•	tessie_api/logging.py → structured logging layer
	•	tests/ directory → pytest with pytest-asyncio

✅ Operational Hygiene
	•	Every agent above should have an associated test.
	•	Fake-mode fixtures must exist to prevent hitting live APIs.
	•	Lint/typecheck pipeline required (mypy, ruff, pytest).
	•	Add observability hooks (logs to R2 or external telemetry).
	•	Maintain environment parity: local = staging = prod.

🚧 TODO / Missing Detection

If any of the following files or patterns are missing, treat them as required setup work:
	•	cf-requirements.txt
	•	tessie_api/jwt_utils.py
	•	tessie_api/requestor.py
	•	tessie_api/logging.py
	•	tests/test_*.py with pytest-asyncio
	•	Cloudflare Worker wrangler.toml aligned with core-tessie-api
	•	Integration test to verify jwt import resolution within Pyodide

⸻

🔮 Future-Facing Improvements
	•	Implement SchedulerAgent for timed wakeups and state pulls.
	•	Introduce telemetry (Sentry, Cloudflare Analytics).
	•	Extend fake-response generator for regression tests.
	•	Optionally integrate KV or D1 cache for distributed state.
	•	Document OpenAPI or JSON schema for each endpoint.
	•	Continuous verification to ensure all baseline assets remain present.

⸻

📚 References
	•	Cloudflare Python Worker Docs
	•	Pyodide Package Reference
	•	Tessie API Reference (Unofficial)
	•	aiohttp Documentation
	•	PyJWT Docs

⸻

Last updated: 2025-10-30
Maintainer: @jmbish04

---
