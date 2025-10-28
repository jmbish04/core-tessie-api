"""Pytest configuration that supplies defaults for integration-style tests."""

from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

os.environ.setdefault("TESSIE_USE_FAKE_RESPONSES", "1")
os.environ.setdefault("TESSIE_FAKE_API_KEY", "FAKE_TESSIE_KEY")
os.environ.setdefault("TESSIE_KEY", os.environ["TESSIE_FAKE_API_KEY"])
os.environ.setdefault("TESLA_VIN", "TESTVIN1234567890")
