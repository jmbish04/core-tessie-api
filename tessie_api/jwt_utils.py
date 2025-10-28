"""Utilities for generating JWT tokens compatible with the Cloudflare worker."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
from typing import Any, Dict, Iterable

import jwt

DEFAULT_EXPIRATION_SECONDS = 30 * 60  # 30 minutes


def generate_worker_jwt(
    secret: str,
    *,
    subject: str = "core-tessie-client",
    expires_in: int = DEFAULT_EXPIRATION_SECONDS,
    additional_claims: Dict[str, Any] | None = None,
) -> str:
    """Return a signed HS256 JWT for authenticating with the worker."""

    now = dt.datetime.utcnow()
    payload: Dict[str, Any] = {
        "sub": subject,
        "iat": now,
        "exp": now + dt.timedelta(seconds=expires_in),
    }
    if additional_claims:
        payload.update(additional_claims)

    return jwt.encode(payload, secret, algorithm="HS256")


def _parse_claims(raw_claims: Iterable[str]) -> Dict[str, Any]:
    claims: Dict[str, Any] = {}
    for raw in raw_claims:
        key, _, raw_value = raw.partition("=")
        if not key:
            raise ValueError(f"Invalid claim '{raw}'. Expected KEY=VALUE format.")
        value = raw_value
        try:
            value = json.loads(raw_value)
        except json.JSONDecodeError:
            # Treat as plain string when it cannot be parsed as JSON.
            value = raw_value
        claims[key] = value
    return claims


def main(argv: Iterable[str] | None = None) -> str:
    parser = argparse.ArgumentParser(description="Generate a JWT for the Tessie Cloudflare worker.")
    parser.add_argument(
        "--secret",
        default=os.getenv("JWT_SECRET"),
        help="Signing secret. Defaults to the JWT_SECRET environment variable.",
    )
    parser.add_argument(
        "--subject",
        default=os.getenv("JWT_SUBJECT", "core-tessie-client"),
        help="Subject claim to include in the token.",
    )
    parser.add_argument(
        "--expires-in",
        type=int,
        default=int(os.getenv("JWT_EXPIRES_IN", DEFAULT_EXPIRATION_SECONDS)),
        help="Token lifetime in seconds (default: 1800).",
    )
    parser.add_argument(
        "--claim",
        action="append",
        default=[],
        metavar="KEY=VALUE",
        help="Extra claims to embed. Values are parsed as JSON when possible.",
    )

    args = parser.parse_args(list(argv) if argv is not None else None)
    if not args.secret:
        parser.error("A signing secret is required. Provide --secret or set JWT_SECRET.")

    extra_claims = _parse_claims(args.claim)
    token = generate_worker_jwt(
        args.secret,
        subject=args.subject,
        expires_in=args.expires_in,
        additional_claims=extra_claims,
    )
    print(token)
    return token


if __name__ == "__main__":
    main()
