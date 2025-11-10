"""
Cloudflare Python Worker for Tessie APIs

Unified worker providing access to:
- Tessie REST API (/api/tessie/*)
- Teslemetry API (/api/telemetry/*)
- Tesla Fleet API (/api/fleet/*)

Plus health checks, diagnostics, and status endpoints.
"""

import json
import os
from typing import Any, Dict, Optional
from urllib.parse import parse_qs, urlparse

try:
    from cloudflare_workers import Response
except ImportError:
    # Local testing fallback
    class Response:
        def __init__(self, body: str = "", status: int = 200, headers: Optional[Dict[str, str]] = None) -> None:
            self.body = body
            self.status = status
            self.headers = headers or {}


from tessie_client import UnifiedTessieClient, TessieAPIError
from utils.health import HealthChecker


class HTTPException(Exception):
    """HTTP exception with status code"""

    def __init__(self, status: int, message: str) -> None:
        super().__init__(message)
        self.status = status
        self.message = message


def _json_response(data: Any, status: int = 200) -> Response:
    """Create JSON response"""
    body = json.dumps(data, indent=2)
    return Response(body, status=status, headers={"Content-Type": "application/json"})


def _error_response(status: int, message: str) -> Response:
    """Create error response"""
    return _json_response({"error": message}, status=status)


def _parse_query_params(url: str) -> Dict[str, Any]:
    """Parse query parameters from URL"""
    parsed = urlparse(url)
    params = parse_qs(parsed.query)
    return {k: v[0] if len(v) == 1 else v for k, v in params.items()}


async def _parse_json_body(request) -> Dict[str, Any]:
    """Parse JSON request body"""
    try:
        if request.headers.get("Content-Type", "").startswith("application/json"):
            return await request.json()
        return {}
    except Exception as e:
        raise HTTPException(400, f"Invalid JSON body: {str(e)}")


def _extract_path_suffix(full_path: str, prefix: str) -> str:
    """Extract path suffix after prefix"""
    if full_path.startswith(prefix):
        return full_path[len(prefix):].lstrip("/")
    return ""


async def fetch(request, env, ctx):
    """
    Main Cloudflare Worker entry point

    Routes:
        GET  /health          - Unified health check for all APIs
        GET  /status          - Detailed status including auth validation
        GET  /api/tessie/*    - Tessie REST API proxy
        GET  /api/telemetry/* - Teslemetry API proxy
        GET  /api/fleet/*     - Tesla Fleet API proxy
        *    *                - Static assets from ASSETS binding
    """

    parsed_url = urlparse(str(request.url))
    path = parsed_url.path
    method = request.method.upper()

    # Initialize unified client from environment variables
    tessie_token = getattr(env, "TESSIE_API_KEY", os.getenv("TESSIE_API_KEY"))
    telemetry_token = getattr(env, "TESLEMETRY_API_KEY", os.getenv("TESLEMETRY_API_KEY"))
    fleet_token = getattr(env, "FLEET_API_KEY", os.getenv("FLEET_API_KEY"))
    fleet_region = getattr(env, "FLEET_REGION", os.getenv("FLEET_REGION", "na"))

    client = UnifiedTessieClient(
        tessie_token=tessie_token,
        telemetry_token=telemetry_token,
        fleet_token=fleet_token,
        fleet_region=fleet_region
    )

    try:
        # ========== Health and Status Endpoints ==========

        if path == "/health" and method == "GET":
            """Unified health check for all APIs"""
            health_checker = HealthChecker(client)
            result = await health_checker.check_all()
            await client.close()
            return _json_response(result)

        if path == "/status" and method == "GET":
            """Detailed status including auth validation"""
            health_checker = HealthChecker(client)
            health_result = await health_checker.check_all()
            auth_result = await health_checker.check_auth()
            await client.close()

            return _json_response({
                "health": health_result,
                "authentication": auth_result,
                "configuration": {
                    "tessie_configured": tessie_token is not None,
                    "telemetry_configured": telemetry_token is not None,
                    "fleet_configured": fleet_token is not None,
                    "fleet_region": fleet_region
                }
            })

        # ========== Tessie REST API Routes ==========

        if path.startswith("/api/tessie/"):
            if not client.tessie:
                await client.close()
                return _error_response(503, "Tessie API not configured")

            endpoint = _extract_path_suffix(path, "/api/tessie")
            params = _parse_query_params(str(request.url))
            json_body = await _parse_json_body(request) if method in ["POST", "PUT", "PATCH"] else None

            try:
                # Route to appropriate Tessie client method
                if endpoint == "vehicles":
                    only_active = params.get("only_active", "true").lower() == "true"
                    result = await client.tessie.list_vehicles(only_active=only_active)

                elif endpoint.endswith("/state"):
                    vin = endpoint.split("/")[0]
                    result = await client.tessie.state(vin)

                elif endpoint.endswith("/battery"):
                    vin = endpoint.split("/")[0]
                    result = await client.tessie.battery(vin)

                elif endpoint.endswith("/wake") and method == "POST":
                    vin = endpoint.split("/")[0]
                    result = await client.tessie.wake(vin)

                elif "/command/start_charging" in endpoint and method == "POST":
                    vin = endpoint.split("/")[0]
                    result = await client.tessie.start_charging(vin)

                elif "/command/stop_charging" in endpoint and method == "POST":
                    vin = endpoint.split("/")[0]
                    result = await client.tessie.stop_charging(vin)

                elif "/command/set_charge_limit" in endpoint and method == "POST":
                    vin = endpoint.split("/")[0]
                    percent = json_body.get("percent") if json_body else None
                    if percent is None:
                        raise HTTPException(400, "Missing 'percent' parameter")
                    result = await client.tessie.set_charge_limit(vin, int(percent))

                elif "/command/lock" in endpoint and method == "POST":
                    vin = endpoint.split("/")[0]
                    result = await client.tessie.lock(vin)

                elif "/command/unlock" in endpoint and method == "POST":
                    vin = endpoint.split("/")[0]
                    result = await client.tessie.unlock(vin)

                elif "/command/flash_lights" in endpoint and method == "POST":
                    vin = endpoint.split("/")[0]
                    result = await client.tessie.flash_lights(vin)

                elif "/command/honk" in endpoint and method == "POST":
                    vin = endpoint.split("/")[0]
                    result = await client.tessie.honk(vin)

                elif "/command/start_climate" in endpoint and method == "POST":
                    vin = endpoint.split("/")[0]
                    result = await client.tessie.start_climate(vin)

                elif "/command/stop_climate" in endpoint and method == "POST":
                    vin = endpoint.split("/")[0]
                    result = await client.tessie.stop_climate(vin)

                else:
                    await client.close()
                    return _error_response(404, f"Tessie endpoint not found: {endpoint}")

                await client.close()
                return _json_response(result)

            except TessieAPIError as e:
                await client.close()
                return _error_response(e.status_code or 500, e.message)

        # ========== Teslemetry API Routes ==========

        if path.startswith("/api/telemetry/"):
            if not client.telemetry:
                await client.close()
                return _error_response(503, "Teslemetry API not configured")

            endpoint = _extract_path_suffix(path, "/api/telemetry")
            params = _parse_query_params(str(request.url))

            try:
                if endpoint == "ping":
                    result = await client.telemetry.ping()

                elif endpoint == "test":
                    result = await client.telemetry.test()

                elif endpoint == "metadata":
                    result = await client.telemetry.metadata()

                elif endpoint == "scopes":
                    result = await client.telemetry.scopes()

                elif "/polling" in endpoint:
                    vin = endpoint.split("/")[1]
                    enabled_param = params.get("enabled")

                    if enabled_param is None and method == "GET":
                        result = await client.telemetry.server_side_polling(vin, None)
                    elif enabled_param == "true" or method == "POST":
                        result = await client.telemetry.server_side_polling(vin, True)
                    elif enabled_param == "false" or method == "DELETE":
                        result = await client.telemetry.server_side_polling(vin, False)
                    else:
                        raise HTTPException(400, "Invalid polling operation")

                elif "/refresh" in endpoint and method == "POST":
                    vin = endpoint.split("/")[1]
                    result = await client.telemetry.vehicle_data_refresh(vin)

                else:
                    await client.close()
                    return _error_response(404, f"Teslemetry endpoint not found: {endpoint}")

                await client.close()
                return _json_response(result)

            except TessieAPIError as e:
                await client.close()
                return _error_response(e.status_code or 500, e.message)

        # ========== Tesla Fleet API Routes ==========

        if path.startswith("/api/fleet/"):
            if not client.fleet:
                await client.close()
                return _error_response(503, "Tesla Fleet API not configured")

            endpoint = _extract_path_suffix(path, "/api/fleet")
            params = _parse_query_params(str(request.url))
            json_body = await _parse_json_body(request) if method in ["POST", "PUT", "PATCH"] else None

            try:
                if endpoint == "vehicles":
                    result = await client.fleet.list_vehicles()

                elif "/vehicle_data" in endpoint:
                    vin = endpoint.split("/")[0]
                    endpoints_param = params.get("endpoints")
                    result = await client.fleet.vehicle_data(vin, endpoints_param)

                elif "/wake_up" in endpoint and method == "POST":
                    vin = endpoint.split("/")[0]
                    result = await client.fleet.wake_up(vin)

                elif "/command/" in endpoint and method == "POST":
                    parts = endpoint.split("/command/")
                    vin = parts[0]
                    command = parts[1]
                    result = await client.fleet.command(vin, command, json_body)

                else:
                    await client.close()
                    return _error_response(404, f"Fleet endpoint not found: {endpoint}")

                await client.close()
                return _json_response(result)

            except TessieAPIError as e:
                await client.close()
                return _error_response(e.status_code or 500, e.message)

        # ========== Static Assets Fallback ==========

        assets_binding = getattr(env, "ASSETS", None)
        if assets_binding:
            await client.close()
            return await assets_binding.fetch(request)

        await client.close()
        return _error_response(404, "Not Found")

    except HTTPException as e:
        await client.close()
        return _error_response(e.status, e.message)

    except Exception as e:
        await client.close()
        print(f"Unexpected error: {str(e)}")
        return _error_response(500, f"Internal Server Error: {str(e)}")
