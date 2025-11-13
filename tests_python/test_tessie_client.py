"""
Unit tests for Tessie Client

Tests the unified client module and all three API wrappers.
"""

import pytest
import httpx
from unittest.mock import AsyncMock, MagicMock, patch

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src_python'))

from tessie_client import (
    UnifiedTessieClient,
    TessieClient,
    TeslemetryClient,
    FleetAPIClient,
    TessieAPIError
)


@pytest.fixture
def mock_client():
    """Create a mock httpx.AsyncClient"""
    client = AsyncMock(spec=httpx.AsyncClient)
    client.request = AsyncMock()
    client.aclose = AsyncMock()
    return client


@pytest.fixture
def tessie_client(mock_client):
    """Create TessieClient with mock"""
    return TessieClient(access_token="test_token", client=mock_client)


@pytest.fixture
def telemetry_client(mock_client):
    """Create TeslemetryClient with mock"""
    return TeslemetryClient(access_token="test_token", client=mock_client)


@pytest.fixture
def fleet_client(mock_client):
    """Create FleetAPIClient with mock"""
    return FleetAPIClient(access_token="test_token", client=mock_client, region="na")


class TestTessieClient:
    """Test Tessie REST API client"""

    @pytest.mark.asyncio
    async def test_list_vehicles(self, tessie_client, mock_client):
        """Test list vehicles endpoint"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"results": [{"vin": "TEST123"}]}
        mock_client.request.return_value = mock_response

        result = await tessie_client.list_vehicles(only_active=True)

        assert "results" in result
        assert len(result["results"]) == 1
        mock_client.request.assert_called_once()

    @pytest.mark.asyncio
    async def test_state(self, tessie_client, mock_client):
        """Test vehicle state endpoint"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"state": "online", "battery_level": 80}
        mock_client.request.return_value = mock_response

        result = await tessie_client.state("TEST123")

        assert "state" in result
        assert result["battery_level"] == 80

    @pytest.mark.asyncio
    async def test_start_charging(self, tessie_client, mock_client):
        """Test start charging command"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"result": True}
        mock_client.request.return_value = mock_response

        result = await tessie_client.start_charging("TEST123")

        assert result["result"] is True

    @pytest.mark.asyncio
    async def test_api_error(self, tessie_client, mock_client):
        """Test API error handling"""
        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_response.text = "Unauthorized"
        mock_response.raise_for_status.side_effect = httpx.HTTPStatusError(
            "Unauthorized", request=MagicMock(), response=mock_response
        )
        mock_client.request.return_value = mock_response

        with pytest.raises(TessieAPIError) as exc_info:
            await tessie_client.list_vehicles()

        assert exc_info.value.status_code == 401


class TestTeslemetryClient:
    """Test Teslemetry API client"""

    @pytest.mark.asyncio
    async def test_ping(self, telemetry_client, mock_client):
        """Test ping endpoint"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"status": "ok"}
        mock_client.request.return_value = mock_response

        result = await telemetry_client.ping()

        assert result["status"] == "ok"

    @pytest.mark.asyncio
    async def test_metadata(self, telemetry_client, mock_client):
        """Test metadata endpoint"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"scopes": ["vehicle_device_data"]}
        mock_client.request.return_value = mock_response

        result = await telemetry_client.metadata()

        assert "scopes" in result


class TestFleetAPIClient:
    """Test Tesla Fleet API client"""

    @pytest.mark.asyncio
    async def test_list_vehicles(self, fleet_client, mock_client):
        """Test list vehicles endpoint"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"response": [{"vin": "5YJ3E1EA1KF000001"}]}
        mock_client.request.return_value = mock_response

        result = await fleet_client.list_vehicles()

        assert "response" in result
        assert len(result["response"]) == 1

    @pytest.mark.asyncio
    async def test_wake_up(self, fleet_client, mock_client):
        """Test wake up command"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"response": {"state": "online"}}
        mock_client.request.return_value = mock_response

        result = await fleet_client.wake_up("5YJ3E1EA1KF000001")

        assert "response" in result


class TestUnifiedTessieClient:
    """Test unified client"""

    @pytest.mark.asyncio
    async def test_initialization(self):
        """Test client initialization"""
        client = UnifiedTessieClient(
            tessie_token="tessie_token",
            telemetry_token="telemetry_token",
            fleet_token="fleet_token",
            fleet_region="na"
        )

        assert client.tessie is not None
        assert client.telemetry is not None
        assert client.fleet is not None

        await client.close()

    @pytest.mark.asyncio
    async def test_partial_initialization(self):
        """Test client with only some tokens"""
        client = UnifiedTessieClient(
            tessie_token="tessie_token"
        )

        assert client.tessie is not None
        assert client.telemetry is None
        assert client.fleet is None

        await client.close()

    @pytest.mark.asyncio
    async def test_context_manager(self):
        """Test async context manager"""
        async with UnifiedTessieClient(tessie_token="test") as client:
            assert client.tessie is not None
