"""
Health check utilities for all three Tessie APIs

Provides unified health checking, connectivity tests, and status reporting
for Tessie, Teslemetry, and Tesla Fleet APIs.
"""

import asyncio
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, Any, Optional
from enum import Enum

from ..tessie_client import UnifiedTessieClient, TessieAPIError


class HealthStatus(Enum):
    """Health status enumeration"""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"


@dataclass
class APIStatus:
    """Status information for a single API"""
    name: str
    status: HealthStatus
    response_time_ms: Optional[float]
    last_check: str
    error: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


class HealthChecker:
    """Health checker for all Tessie-related APIs"""

    def __init__(self, unified_client: UnifiedTessieClient):
        """
        Initialize health checker

        Args:
            unified_client: UnifiedTessieClient instance
        """
        self.client = unified_client

    async def check_tessie(self) -> APIStatus:
        """
        Check Tessie API health

        Returns:
            APIStatus with connectivity and basic functionality test results
        """
        if not self.client.tessie:
            return APIStatus(
                name="Tessie API",
                status=HealthStatus.UNKNOWN,
                response_time_ms=None,
                last_check=datetime.utcnow().isoformat(),
                error="API token not configured"
            )

        start_time = datetime.utcnow()

        try:
            # Try to list vehicles as a connectivity test
            result = await self.client.tessie.list_vehicles(only_active=True)

            duration_ms = (datetime.utcnow() - start_time).total_seconds() * 1000

            # Successful response
            return APIStatus(
                name="Tessie API",
                status=HealthStatus.HEALTHY,
                response_time_ms=duration_ms,
                last_check=datetime.utcnow().isoformat(),
                details={
                    "vehicle_count": len(result.get("results", [])),
                    "endpoint": "vehicles"
                }
            )

        except TessieAPIError as e:
            duration_ms = (datetime.utcnow() - start_time).total_seconds() * 1000

            # API responded but with error
            status = HealthStatus.DEGRADED if e.status_code and e.status_code < 500 else HealthStatus.UNHEALTHY

            return APIStatus(
                name="Tessie API",
                status=status,
                response_time_ms=duration_ms,
                last_check=datetime.utcnow().isoformat(),
                error=e.message,
                details={"status_code": e.status_code}
            )

        except Exception as e:
            duration_ms = (datetime.utcnow() - start_time).total_seconds() * 1000

            return APIStatus(
                name="Tessie API",
                status=HealthStatus.UNHEALTHY,
                response_time_ms=duration_ms,
                last_check=datetime.utcnow().isoformat(),
                error=str(e)
            )

    async def check_telemetry(self) -> APIStatus:
        """
        Check Teslemetry API health

        Returns:
            APIStatus with ping/test endpoint results
        """
        if not self.client.telemetry:
            return APIStatus(
                name="Teslemetry API",
                status=HealthStatus.UNKNOWN,
                response_time_ms=None,
                last_check=datetime.utcnow().isoformat(),
                error="API token not configured"
            )

        start_time = datetime.utcnow()

        try:
            # Use ping endpoint for health check
            result = await self.client.telemetry.ping()

            duration_ms = (datetime.utcnow() - start_time).total_seconds() * 1000

            return APIStatus(
                name="Teslemetry API",
                status=HealthStatus.HEALTHY,
                response_time_ms=duration_ms,
                last_check=datetime.utcnow().isoformat(),
                details={"ping_result": result}
            )

        except TessieAPIError as e:
            duration_ms = (datetime.utcnow() - start_time).total_seconds() * 1000

            status = HealthStatus.DEGRADED if e.status_code and e.status_code < 500 else HealthStatus.UNHEALTHY

            return APIStatus(
                name="Teslemetry API",
                status=status,
                response_time_ms=duration_ms,
                last_check=datetime.utcnow().isoformat(),
                error=e.message,
                details={"status_code": e.status_code}
            )

        except Exception as e:
            duration_ms = (datetime.utcnow() - start_time).total_seconds() * 1000

            return APIStatus(
                name="Teslemetry API",
                status=HealthStatus.UNHEALTHY,
                response_time_ms=duration_ms,
                last_check=datetime.utcnow().isoformat(),
                error=str(e)
            )

    async def check_fleet(self) -> APIStatus:
        """
        Check Tesla Fleet API health

        Returns:
            APIStatus with vehicle list endpoint test
        """
        if not self.client.fleet:
            return APIStatus(
                name="Tesla Fleet API",
                status=HealthStatus.UNKNOWN,
                response_time_ms=None,
                last_check=datetime.utcnow().isoformat(),
                error="API token not configured"
            )

        start_time = datetime.utcnow()

        try:
            # Try to list vehicles
            result = await self.client.fleet.list_vehicles()

            duration_ms = (datetime.utcnow() - start_time).total_seconds() * 1000

            return APIStatus(
                name="Tesla Fleet API",
                status=HealthStatus.HEALTHY,
                response_time_ms=duration_ms,
                last_check=datetime.utcnow().isoformat(),
                details={
                    "vehicle_count": len(result.get("response", [])),
                    "region": self.client.fleet.region
                }
            )

        except TessieAPIError as e:
            duration_ms = (datetime.utcnow() - start_time).total_seconds() * 1000

            status = HealthStatus.DEGRADED if e.status_code and e.status_code < 500 else HealthStatus.UNHEALTHY

            return APIStatus(
                name="Tesla Fleet API",
                status=status,
                response_time_ms=duration_ms,
                last_check=datetime.utcnow().isoformat(),
                error=e.message,
                details={"status_code": e.status_code}
            )

        except Exception as e:
            duration_ms = (datetime.utcnow() - start_time).total_seconds() * 1000

            return APIStatus(
                name="Tesla Fleet API",
                status=HealthStatus.UNHEALTHY,
                response_time_ms=duration_ms,
                last_check=datetime.utcnow().isoformat(),
                error=str(e)
            )

    async def check_all(self) -> Dict[str, Any]:
        """
        Check health of all configured APIs in parallel

        Returns:
            Dictionary with overall status and individual API statuses
        """
        # Run all health checks in parallel
        tessie_status, telemetry_status, fleet_status = await asyncio.gather(
            self.check_tessie(),
            self.check_telemetry(),
            self.check_fleet(),
            return_exceptions=False
        )

        # Determine overall status
        statuses = [tessie_status.status, telemetry_status.status, fleet_status.status]

        if all(s == HealthStatus.HEALTHY for s in statuses if s != HealthStatus.UNKNOWN):
            overall_status = HealthStatus.HEALTHY
        elif any(s == HealthStatus.UNHEALTHY for s in statuses if s != HealthStatus.UNKNOWN):
            overall_status = HealthStatus.UNHEALTHY
        elif any(s == HealthStatus.DEGRADED for s in statuses if s != HealthStatus.UNKNOWN):
            overall_status = HealthStatus.DEGRADED
        else:
            overall_status = HealthStatus.UNKNOWN

        return {
            "status": overall_status.value,
            "timestamp": datetime.utcnow().isoformat(),
            "apis": {
                "tessie": {
                    "status": tessie_status.status.value,
                    "response_time_ms": tessie_status.response_time_ms,
                    "last_check": tessie_status.last_check,
                    "error": tessie_status.error,
                    "details": tessie_status.details
                },
                "telemetry": {
                    "status": telemetry_status.status.value,
                    "response_time_ms": telemetry_status.response_time_ms,
                    "last_check": telemetry_status.last_check,
                    "error": telemetry_status.error,
                    "details": telemetry_status.details
                },
                "fleet": {
                    "status": fleet_status.status.value,
                    "response_time_ms": fleet_status.response_time_ms,
                    "last_check": fleet_status.last_check,
                    "error": fleet_status.error,
                    "details": fleet_status.details
                }
            }
        }

    async def check_auth(self) -> Dict[str, Any]:
        """
        Check authentication status for all APIs

        Returns:
            Dictionary with auth validation results
        """
        results = {
            "timestamp": datetime.utcnow().isoformat(),
            "auth_status": {}
        }

        # Check Tessie auth
        if self.client.tessie:
            try:
                await self.client.tessie.list_vehicles(only_active=True)
                results["auth_status"]["tessie"] = {
                    "valid": True,
                    "message": "Authentication successful"
                }
            except TessieAPIError as e:
                results["auth_status"]["tessie"] = {
                    "valid": False,
                    "message": e.message,
                    "status_code": e.status_code
                }
        else:
            results["auth_status"]["tessie"] = {
                "valid": None,
                "message": "Token not configured"
            }

        # Check Teslemetry auth
        if self.client.telemetry:
            try:
                await self.client.telemetry.test()
                results["auth_status"]["telemetry"] = {
                    "valid": True,
                    "message": "Authentication successful"
                }
            except TessieAPIError as e:
                results["auth_status"]["telemetry"] = {
                    "valid": False,
                    "message": e.message,
                    "status_code": e.status_code
                }
        else:
            results["auth_status"]["telemetry"] = {
                "valid": None,
                "message": "Token not configured"
            }

        # Check Fleet auth
        if self.client.fleet:
            try:
                await self.client.fleet.list_vehicles()
                results["auth_status"]["fleet"] = {
                    "valid": True,
                    "message": "Authentication successful"
                }
            except TessieAPIError as e:
                results["auth_status"]["fleet"] = {
                    "valid": False,
                    "message": e.message,
                    "status_code": e.status_code
                }
        else:
            results["auth_status"]["fleet"] = {
                "valid": None,
                "message": "Token not configured"
            }

        return results
