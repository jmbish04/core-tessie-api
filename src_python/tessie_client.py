"""
Unified Tessie Client Module

This module provides a unified interface to all three Tessie-related APIs:
1. Tesla Fleet API - Official Tesla Fleet management
2. Teslemetry API - Third-party telemetry service
3. Tessie REST API - Third-party vehicle management service

All API clients share a common async HTTP client (httpx.AsyncClient) and
provide consistent error handling and logging.
"""

import json
import logging
from enum import Enum
from typing import Any, Dict, Optional
from datetime import datetime

import httpx


# Configure structured logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class APIType(Enum):
    """API type enumeration"""
    FLEET = "fleet"
    TELEMETRY = "telemetry"
    TESSIE = "tessie"


def log_api_call(api_type: APIType, endpoint: str, status: int, duration_ms: float, error: Optional[str] = None):
    """Structured logging for API interactions"""
    log_data = {
        "event": "api_call",
        "api": api_type.value,
        "endpoint": endpoint,
        "status": status,
        "duration_ms": duration_ms,
        "timestamp": datetime.utcnow().isoformat(),
    }
    if error:
        log_data["error"] = error

    print(json.dumps(log_data))


class TessieAPIError(Exception):
    """Base exception for Tessie API errors"""
    def __init__(self, message: str, status_code: Optional[int] = None):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class BaseAPIClient:
    """Base class for all API clients with common functionality"""

    def __init__(self, base_url: str, access_token: str, client: httpx.AsyncClient):
        """
        Initialize base API client

        Args:
            base_url: API base URL
            access_token: API access token
            client: Shared httpx AsyncClient instance
        """
        self.base_url = base_url.rstrip('/')
        self.access_token = access_token
        self.client = client
        self.api_type: APIType = APIType.TESSIE  # Override in subclasses

    async def _request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        json_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Make an authenticated HTTP request

        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint path
            params: Query parameters
            json_data: JSON request body

        Returns:
            Response data as dictionary

        Raises:
            TessieAPIError: On API errors
        """
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }

        start_time = datetime.utcnow()

        try:
            response = await self.client.request(
                method=method,
                url=url,
                headers=headers,
                params=params,
                json=json_data,
                timeout=30.0
            )

            duration_ms = (datetime.utcnow() - start_time).total_seconds() * 1000

            log_api_call(
                self.api_type,
                endpoint,
                response.status_code,
                duration_ms
            )

            response.raise_for_status()
            return response.json()

        except httpx.HTTPStatusError as e:
            duration_ms = (datetime.utcnow() - start_time).total_seconds() * 1000
            error_msg = f"HTTP {e.response.status_code}: {e.response.text}"

            log_api_call(
                self.api_type,
                endpoint,
                e.response.status_code,
                duration_ms,
                error_msg
            )

            raise TessieAPIError(error_msg, e.response.status_code)

        except Exception as e:
            duration_ms = (datetime.utcnow() - start_time).total_seconds() * 1000
            error_msg = f"Request failed: {str(e)}"

            log_api_call(
                self.api_type,
                endpoint,
                0,
                duration_ms,
                error_msg
            )

            raise TessieAPIError(error_msg)


class TessieClient(BaseAPIClient):
    """Tessie REST API client"""

    def __init__(self, access_token: str, client: httpx.AsyncClient):
        """Initialize Tessie API client"""
        super().__init__("https://api.tessie.com", access_token, client)
        self.api_type = APIType.TESSIE

    async def list_vehicles(self, only_active: bool = True) -> Dict[str, Any]:
        """List all vehicles"""
        params = {"only_active": str(only_active).lower()}
        return await self._request("GET", "vehicles", params=params)

    async def state(self, vin: str) -> Dict[str, Any]:
        """Get vehicle state"""
        return await self._request("GET", f"{vin}/state")

    async def battery(self, vin: str) -> Dict[str, Any]:
        """Get battery information"""
        return await self._request("GET", f"{vin}/battery")

    async def battery_health(
        self,
        vin: str,
        start: Optional[str] = None,
        end: Optional[str] = None,
        distance_format: str = "mi"
    ) -> Dict[str, Any]:
        """Get battery health history"""
        params = {"distance_format": distance_format}
        if start:
            params["start"] = start
        if end:
            params["end"] = end
        return await self._request("GET", f"{vin}/battery_health", params=params)

    async def wake(self, vin: str) -> Dict[str, Any]:
        """Wake up vehicle"""
        return await self._request("POST", f"{vin}/wake")

    async def start_charging(self, vin: str) -> Dict[str, Any]:
        """Start charging"""
        return await self._request("POST", f"{vin}/command/start_charging")

    async def stop_charging(self, vin: str) -> Dict[str, Any]:
        """Stop charging"""
        return await self._request("POST", f"{vin}/command/stop_charging")

    async def set_charge_limit(self, vin: str, percent: int) -> Dict[str, Any]:
        """Set charge limit"""
        return await self._request("POST", f"{vin}/command/set_charge_limit", json_data={"percent": percent})

    async def lock(self, vin: str) -> Dict[str, Any]:
        """Lock vehicle"""
        return await self._request("POST", f"{vin}/command/lock")

    async def unlock(self, vin: str) -> Dict[str, Any]:
        """Unlock vehicle"""
        return await self._request("POST", f"{vin}/command/unlock")

    async def flash_lights(self, vin: str) -> Dict[str, Any]:
        """Flash lights"""
        return await self._request("POST", f"{vin}/command/flash_lights")

    async def honk(self, vin: str) -> Dict[str, Any]:
        """Honk horn"""
        return await self._request("POST", f"{vin}/command/honk")

    async def start_climate(self, vin: str) -> Dict[str, Any]:
        """Start climate control"""
        return await self._request("POST", f"{vin}/command/start_climate")

    async def stop_climate(self, vin: str) -> Dict[str, Any]:
        """Stop climate control"""
        return await self._request("POST", f"{vin}/command/stop_climate")


class TeslemetryClient(BaseAPIClient):
    """Teslemetry API client"""

    def __init__(self, access_token: str, client: httpx.AsyncClient, server: Optional[str] = None):
        """Initialize Teslemetry API client"""
        base_url = server or "https://api.teslemetry.com"
        super().__init__(base_url, access_token, client)
        self.api_type = APIType.TELEMETRY

    async def ping(self) -> Dict[str, Any]:
        """Health check endpoint"""
        return await self._request("GET", "ping")

    async def test(self) -> Dict[str, Any]:
        """Test API credentials"""
        return await self._request("GET", "test")

    async def metadata(self) -> Dict[str, Any]:
        """Get user metadata and scopes"""
        return await self._request("GET", "metadata")

    async def scopes(self) -> Dict[str, Any]:
        """Get available permission scopes"""
        return await self._request("GET", "scopes")

    async def server_side_polling(self, vin: str, enabled: Optional[bool] = None) -> Dict[str, Any]:
        """Manage server-side polling for a vehicle"""
        if enabled is None:
            return await self._request("GET", f"vehicles/{vin}/polling")
        elif enabled:
            return await self._request("POST", f"vehicles/{vin}/polling")
        else:
            return await self._request("DELETE", f"vehicles/{vin}/polling")

    async def vehicle_data_refresh(self, vin: str) -> Dict[str, Any]:
        """Force vehicle data refresh"""
        return await self._request("POST", f"vehicles/{vin}/refresh")


class FleetAPIClient(BaseAPIClient):
    """Tesla Fleet API client"""

    def __init__(self, access_token: str, client: httpx.AsyncClient, region: str = "na"):
        """
        Initialize Fleet API client

        Args:
            access_token: Fleet API access token
            client: Shared httpx AsyncClient
            region: Region code (na, eu, cn)
        """
        region_urls = {
            "na": "https://fleet-api.prd.na.vn.cloud.tesla.com",
            "eu": "https://fleet-api.prd.eu.vn.cloud.tesla.com",
            "cn": "https://fleet-api.prd.cn.vn.cloud.tesla.cn"
        }
        base_url = region_urls.get(region, region_urls["na"])
        super().__init__(base_url, access_token, client)
        self.api_type = APIType.FLEET
        self.region = region

    async def list_vehicles(self) -> Dict[str, Any]:
        """List all vehicles in fleet"""
        return await self._request("GET", "api/1/vehicles")

    async def vehicle_data(self, vin: str, endpoints: Optional[str] = None) -> Dict[str, Any]:
        """
        Get vehicle data

        Args:
            vin: Vehicle VIN
            endpoints: Comma-separated list of endpoints to fetch
        """
        params = {"endpoints": endpoints} if endpoints else None
        return await self._request("GET", f"api/1/vehicles/{vin}/vehicle_data", params=params)

    async def wake_up(self, vin: str) -> Dict[str, Any]:
        """Wake up vehicle"""
        return await self._request("POST", f"api/1/vehicles/{vin}/wake_up")

    async def command(self, vin: str, command: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Execute vehicle command

        Args:
            vin: Vehicle VIN
            command: Command name (e.g., 'charge_start', 'charge_stop')
            params: Command parameters
        """
        return await self._request("POST", f"api/1/vehicles/{vin}/command/{command}", json_data=params)


class UnifiedTessieClient:
    """
    Unified client providing access to all three APIs through a single interface
    """

    def __init__(
        self,
        tessie_token: Optional[str] = None,
        telemetry_token: Optional[str] = None,
        fleet_token: Optional[str] = None,
        fleet_region: str = "na"
    ):
        """
        Initialize unified client with tokens for each API

        Args:
            tessie_token: Tessie API token
            telemetry_token: Teslemetry API token
            fleet_token: Tesla Fleet API token
            fleet_region: Fleet API region (na, eu, cn)
        """
        self.client = httpx.AsyncClient()

        # Initialize API clients if tokens provided
        self.tessie: Optional[TessieClient] = None
        self.telemetry: Optional[TeslemetryClient] = None
        self.fleet: Optional[FleetAPIClient] = None

        if tessie_token:
            self.tessie = TessieClient(tessie_token, self.client)

        if telemetry_token:
            self.telemetry = TeslemetryClient(telemetry_token, self.client)

        if fleet_token:
            self.fleet = FleetAPIClient(fleet_token, self.client, fleet_region)

    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()

    async def __aenter__(self):
        """Async context manager entry"""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.close()
