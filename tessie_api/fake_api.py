"""Deterministic fake responses for Tessie endpoints used in tests."""

from __future__ import annotations

import os
from typing import Any, Dict, Optional

DEFAULT_VIN = "TESTVIN1234567890"


def _resolve_vin() -> str:
    return os.getenv("TESLA_VIN", DEFAULT_VIN)


def get_fake_response(path: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Return a canned response for the requested Tessie API path."""

    if path == "/vehicles":
        vin = _resolve_vin()
        return {
            "count": 1,
            "results": [
                {
                    "vin": vin,
                    "state": "online",
                    "display_name": "Simulated Tessie",
                    "id": f"{vin}-simulated",
                }
            ],
        }

    if path.endswith("/state"):
        vin = _resolve_vin()
        return {"vin": vin, "state": "online"}

    # Generic fallback for endpoints that do not yet have bespoke canned data.
    return {
        "path": path,
        "params": params or {},
        "status": "simulated",
    }
