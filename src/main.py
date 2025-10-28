import json
from typing import Any, Awaitable, Callable, Dict, Optional, Tuple
from urllib.parse import parse_qs, urlparse

import jwt
from aiohttp import ClientSession

try:  # Cloudflare Workers runtime provides Response
    from cloudflare_workers import Response
except ImportError:  # pragma: no cover - local testing fallback
    class Response:  # type: ignore
        def __init__(self, body: str = "", status: int = 200, headers: Optional[Dict[str, str]] = None) -> None:
            self.body = body
            self.status = status
            self.headers = headers or {}


from tessie_api import get_state, set_charge_limit, start_charging, wake


class HTTPException(Exception):
    """Exception used to provide HTTP-specific metadata."""

    def __init__(self, status: int, message: str) -> None:
        super().__init__(message)
        self.status = status
        self.message = message


async def _authorize_request(request, env) -> None:
    """Validate Authorization header and JWT token."""

    authorization = request.headers.get("Authorization")
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing or invalid Authorization header")

    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(401, "Missing bearer token")

    jwt_secret = getattr(env, "JWT_SECRET", None)
    if not jwt_secret:
        raise HTTPException(500, "JWT secret is not configured")

    try:
        jwt.decode(token, jwt_secret, algorithms=["HS256"])
    except jwt.PyJWTError as exc:
        raise HTTPException(403, "Invalid token") from exc


def _extract_vin(params: Dict[str, Any]) -> str:
    vin = params.get("vin")
    if isinstance(vin, list):
        vin = vin[0]
    if not isinstance(vin, str) or not vin:
        raise HTTPException(400, "Missing required 'vin' parameter")
    return vin


async def _parse_request_data(request) -> Dict[str, Any]:
    if request.method.upper() == "GET":
        parsed = urlparse(str(request.url))
        return {
            key: values if len(values) > 1 else values[0]
            for key, values in parse_qs(parsed.query).items()
        }

    if request.headers.get("Content-Type", "").startswith("application/json"):
        try:
            body = await request.json()
        except Exception as exc:  # pragma: no cover - defensive
            raise HTTPException(400, "Invalid JSON body") from exc
        if not isinstance(body, dict):
            raise HTTPException(400, "JSON body must be an object")
        return body

    raise HTTPException(400, "Unsupported content type")


def _json_response(data: Any, status: int = 200):
    body = json.dumps(data)
    return Response(body, status=status, headers={"Content-Type": "application/json"})


def _error_response(exc: HTTPException):
    return _json_response({"error": exc.message}, status=exc.status)


async def _handle_status(session: ClientSession, tessie_key: str, params: Dict[str, Any]):
    vin = _extract_vin(params)
    return await get_state(session=session, api_key=tessie_key, vin=vin)


async def _handle_wake(session: ClientSession, tessie_key: str, params: Dict[str, Any]):
    vin = _extract_vin(params)
    return await wake(session=session, api_key=tessie_key, vin=vin)


async def _handle_start_charging(session: ClientSession, tessie_key: str, params: Dict[str, Any]):
    vin = _extract_vin(params)
    return await start_charging(session=session, api_key=tessie_key, vin=vin)


async def _handle_set_charge_limit(session: ClientSession, tessie_key: str, params: Dict[str, Any]):
    vin = _extract_vin(params)
    percent = params.get("percent")
    if percent is None:
        raise HTTPException(400, "Missing required 'percent' parameter")
    try:
        percent_value = int(percent)
    except (TypeError, ValueError) as exc:
        raise HTTPException(400, "'percent' must be an integer") from exc

    return await set_charge_limit(
        session=session,
        api_key=tessie_key,
        vin=vin,
        percent=percent_value,
    )


async def fetch(request, env, ctx):  # noqa: D401 - Cloudflare entry point
    await _authorize_request(request, env)

    routes: Dict[Tuple[str, str], Callable[[ClientSession, str, Dict[str, Any]], Awaitable[Any]]] = {
        ("GET", "/status"): _handle_status,
        ("POST", "/wake"): _handle_wake,
        ("POST", "/command/start_charging"): _handle_start_charging,
        ("POST", "/command/set_charge_limit"): _handle_set_charge_limit,
    }

    parsed_url = urlparse(str(request.url))
    route_handler = routes.get((request.method.upper(), parsed_url.path))
    if not route_handler:
        return _json_response({"error": "Not Found"}, status=404)

    tessie_key = getattr(env, "TESSIE_API_KEY", None)
    if not tessie_key:
        return _json_response({"error": "Tessie API key is not configured"}, status=500)

    try:
        params = await _parse_request_data(request)
        async with ClientSession() as session:
            result = await route_handler(session, tessie_key, params)
    except HTTPException as exc:
        return _error_response(exc)
    except Exception:  # pragma: no cover - catch-all for worker stability
        return _json_response({"error": "Internal Server Error"}, status=500)

    return _json_response(result)
