# Tessie Unified Python Worker

> Cloudflare Python Worker providing unified access to all three Tessie-related APIs

## 🚀 Features

### Three APIs in One Worker

1. **Tessie REST API** (`/api/tessie/*`)
   - Vehicle management and control
   - State monitoring
   - Charging commands
   - Climate control
   - Locks, lights, horn

2. **Teslemetry API** (`/api/telemetry/*`)
   - Server-side polling
   - Vehicle data refresh
   - Metadata and scopes
   - Health checks

3. **Tesla Fleet API** (`/api/fleet/*`)
   - Official Tesla Fleet management
   - Vehicle data endpoints
   - Command execution
   - Regional support (NA, EU, CN)

### Unified Health Monitoring

- `/health` - Comprehensive health check for all APIs
- `/status` - Detailed status with auth validation
- Response time tracking
- Connectivity tests
- Rate limit monitoring

### Production-Ready Features

- ✅ Async/await throughout (httpx.AsyncClient)
- ✅ Structured JSON logging for all API calls
- ✅ Comprehensive error handling
- ✅ Type hints everywhere
- ✅ Modular architecture
- ✅ Environment-based configuration
- ✅ Unit tests with pytest

## 📦 Installation

### Prerequisites

- Python 3.11+
- Cloudflare Workers account
- API tokens for desired services

### Setup

```bash
# Install dependencies
pip install httpx

# Copy environment template
cp .env.example .env

# Edit .env with your API tokens
nano .env
```

### Configuration

Create a `.env` file with your API keys:

```bash
# Tessie API (https://my.tessie.com/settings/api)
TESSIE_API_KEY=your_tessie_api_key

# Teslemetry API (https://teslemetry.com)
TESLEMETRY_API_KEY=your_teslemetry_api_key

# Tesla Fleet API (https://developer.tesla.com)
FLEET_API_KEY=your_fleet_access_token
FLEET_REGION=na  # or 'eu', 'cn'
```

## 🏗️ Project Structure

```
src_python/
├── main.py              # Worker entry point with routing
├── tessie_client.py     # Unified API client module
└── utils/
    ├── __init__.py
    └── health.py        # Health check utilities

tests_python/
└── test_tessie_client.py  # Unit tests

.env.example             # Environment template
README_PYTHON.md         # This file
```

## 🔌 API Endpoints

### Health & Status

#### `GET /health`

Unified health check for all configured APIs.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-03-07T12:00:00.000Z",
  "apis": {
    "tessie": {
      "status": "healthy",
      "response_time_ms": 123.45,
      "details": {"vehicle_count": 2}
    },
    "telemetry": {
      "status": "healthy",
      "response_time_ms": 98.76
    },
    "fleet": {
      "status": "healthy",
      "response_time_ms": 156.32,
      "details": {"region": "na"}
    }
  }
}
```

#### `GET /status`

Detailed status including authentication validation.

**Response:**
```json
{
  "health": { ... },
  "authentication": {
    "auth_status": {
      "tessie": {"valid": true},
      "telemetry": {"valid": true},
      "fleet": {"valid": true}
    }
  },
  "configuration": {
    "tessie_configured": true,
    "telemetry_configured": true,
    "fleet_configured": true,
    "fleet_region": "na"
  }
}
```

### Tessie REST API

All Tessie endpoints are available at `/api/tessie/*`:

```bash
# List vehicles
GET /api/tessie/vehicles?only_active=true

# Get vehicle state
GET /api/tessie/{VIN}/state

# Get battery info
GET /api/tessie/{VIN}/battery

# Wake vehicle
POST /api/tessie/{VIN}/wake

# Start charging
POST /api/tessie/{VIN}/command/start_charging

# Stop charging
POST /api/tessie/{VIN}/command/stop_charging

# Set charge limit
POST /api/tessie/{VIN}/command/set_charge_limit
Body: {"percent": 80}

# Lock/unlock
POST /api/tessie/{VIN}/command/lock
POST /api/tessie/{VIN}/command/unlock

# Flash lights
POST /api/tessie/{VIN}/command/flash_lights

# Honk horn
POST /api/tessie/{VIN}/command/honk

# Climate control
POST /api/tessie/{VIN}/command/start_climate
POST /api/tessie/{VIN}/command/stop_climate
```

### Teslemetry API

Teslemetry endpoints at `/api/telemetry/*`:

```bash
# Ping (health check)
GET /api/telemetry/ping

# Test authentication
GET /api/telemetry/test

# Get metadata
GET /api/telemetry/metadata

# Get scopes
GET /api/telemetry/scopes

# Server-side polling
GET  /api/telemetry/vehicles/{VIN}/polling
POST /api/telemetry/vehicles/{VIN}/polling
DELETE /api/telemetry/vehicles/{VIN}/polling

# Force data refresh
POST /api/telemetry/vehicles/{VIN}/refresh
```

### Tesla Fleet API

Fleet endpoints at `/api/fleet/*`:

```bash
# List vehicles
GET /api/fleet/vehicles

# Get vehicle data
GET /api/fleet/{VIN}/vehicle_data?endpoints=location_data,charge_state

# Wake up
POST /api/fleet/{VIN}/wake_up

# Commands (generic)
POST /api/fleet/{VIN}/command/{command_name}
Body: { ... command params ... }

# Example: Start charging
POST /api/fleet/{VIN}/command/charge_start

# Example: Set charge limit
POST /api/fleet/{VIN}/command/set_charge_limit
Body: {"percent": 80}
```

## 🧪 Testing

Run unit tests with pytest:

```bash
# Install test dependencies
pip install pytest pytest-asyncio

# Run tests
pytest tests_python/

# Run with coverage
pytest --cov=src_python tests_python/
```

## 📝 Usage Examples

### cURL Examples

```bash
# Health check
curl https://your-worker.workers.dev/health

# List Tessie vehicles
curl https://your-worker.workers.dev/api/tessie/vehicles

# Get vehicle state
curl https://your-worker.workers.dev/api/tessie/YOUR_VIN/state

# Start charging
curl -X POST https://your-worker.workers.dev/api/tessie/YOUR_VIN/command/start_charging

# Set charge limit
curl -X POST https://your-worker.workers.dev/api/tessie/YOUR_VIN/command/set_charge_limit \
  -H "Content-Type: application/json" \
  -d '{"percent": 80}'

# Teslemetry ping
curl https://your-worker.workers.dev/api/telemetry/ping

# Fleet API list vehicles
curl https://your-worker.workers.dev/api/fleet/vehicles
```

### Python Client Example

```python
import httpx
import asyncio

async def main():
    async with httpx.AsyncClient() as client:
        # Health check
        response = await client.get("https://your-worker.workers.dev/health")
        print(response.json())

        # List Tessie vehicles
        response = await client.get("https://your-worker.workers.dev/api/tessie/vehicles")
        vehicles = response.json()
        print(f"Found {len(vehicles['results'])} vehicles")

        # Start charging
        vin = "YOUR_VIN"
        response = await client.post(
            f"https://your-worker.workers.dev/api/tessie/{vin}/command/start_charging"
        )
        print(response.json())

asyncio.run(main())
```

## 🔍 Structured Logging

All API calls are logged in structured JSON format:

```json
{
  "event": "api_call",
  "api": "tessie",
  "endpoint": "vehicles",
  "status": 200,
  "duration_ms": 123.45,
  "timestamp": "2025-03-07T12:00:00.000Z"
}
```

Errors include additional context:

```json
{
  "event": "api_call",
  "api": "tessie",
  "endpoint": "TESTVIN/state",
  "status": 401,
  "duration_ms": 98.76,
  "timestamp": "2025-03-07T12:00:00.000Z",
  "error": "HTTP 401: Unauthorized"
}
```

## 🚀 Deployment

### Wrangler Configuration

Update `wrangler.toml` to use Python worker:

```toml
name = "tessie-unified-worker"
main = "src_python/main.py"
compatibility_date = "2024-05-12"
compatibility_flags = ["python_workers"]

[build]
command = "pip install -e ."

[vars]
FLEET_REGION = "na"

# Set secrets via wrangler
# wrangler secret put TESSIE_API_KEY
# wrangler secret put TESLEMETRY_API_KEY
# wrangler secret put FLEET_API_KEY
```

### Deploy

```bash
# Set secrets
wrangler secret put TESSIE_API_KEY
wrangler secret put TESLEMETRY_API_KEY
wrangler secret put FLEET_API_KEY

# Deploy
wrangler deploy
```

## 🔐 Security

- All API tokens stored as Cloudflare secrets
- HTTPS-only communication
- Error messages sanitized (no token leakage)
- Structured logging redacts sensitive data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

See LICENSE file for details.

## 🔗 References

- [Tessie API Documentation](https://developer.tessie.com)
- [Teslemetry API](https://teslemetry.com)
- [Tesla Fleet API](https://developer.tesla.com)
- [Teslemetry python-tesla-fleet-api](https://github.com/Teslemetry/python-tesla-fleet-api)
- [Cloudflare Workers](https://workers.cloudflare.com)

---

**Built with Python 3.11+, httpx, and Cloudflare Workers**
