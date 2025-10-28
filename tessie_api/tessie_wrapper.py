import os
from typing import Any, Dict, Optional

import aiohttp

from .fake_api import get_fake_response


def _normalize_flag(value: Optional[str]) -> str:
    return (value or "").strip().lower()


def _should_use_fake(api_key: Optional[str]) -> bool:
    """Return True when a deterministic fake response should be used."""

    if _normalize_flag(os.getenv("TESSIE_USE_FAKE_RESPONSES")) in {"1", "true", "yes", "on"}:
        return True

    fake_key = os.getenv("TESSIE_FAKE_API_KEY", "FAKE_TESSIE_KEY")
    return api_key == fake_key


async def tessieRequest(
    session: aiohttp.ClientSession,
    method: str,
    path: str,
    api_key: Optional[str],
    params: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    if _should_use_fake(api_key):
        return get_fake_response(path, params=params)

    if not api_key:
        raise ValueError(
            "A Tessie API key is required. Set the TESSIE_KEY environment variable "
            "or pass api_key explicitly."
        )

    url = f"https://api.tessie.com{path}"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    async with session.request(method, url, headers=headers, params=params) as response:
        response.raise_for_status()
        return await response.json()
