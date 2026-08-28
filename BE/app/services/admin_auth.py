import base64
import hashlib
import hmac
import json
import time
from datetime import UTC, datetime

from app.core.config import get_settings


class AdminAuthError(ValueError):
    pass


def _base64url_encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


def _base64url_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def _sign(payload: str, secret: str) -> str:
    signature = hmac.new(secret.encode("utf-8"), payload.encode("ascii"), hashlib.sha256).digest()
    return _base64url_encode(signature)


def create_admin_token(username: str) -> tuple[str, datetime]:
    settings = get_settings()
    expires_at = int(time.time()) + settings.admin_session_minutes * 60
    payload = _base64url_encode(
        json.dumps({"sub": username, "exp": expires_at}, separators=(",", ":")).encode("utf-8")
    )
    token = f"{payload}.{_sign(payload, settings.admin_token_secret)}"
    return token, datetime.fromtimestamp(expires_at, UTC)


def verify_admin_token(token: str) -> str:
    settings = get_settings()
    try:
        payload, signature = token.split(".", 1)
    except ValueError as exc:
        raise AdminAuthError("Invalid admin token") from exc

    expected_signature = _sign(payload, settings.admin_token_secret)
    if not hmac.compare_digest(signature, expected_signature):
        raise AdminAuthError("Invalid admin token")

    try:
        claims = json.loads(_base64url_decode(payload))
    except (json.JSONDecodeError, ValueError) as exc:
        raise AdminAuthError("Invalid admin token") from exc

    username = claims.get("sub")
    expires_at = claims.get("exp")
    if not isinstance(username, str) or not isinstance(expires_at, int):
        raise AdminAuthError("Invalid admin token")
    if expires_at < int(time.time()):
        raise AdminAuthError("Admin token expired")
    return username
