import hashlib
import hmac
import httpx
from datetime import datetime, timezone
from typing import Optional
from fastapi import HTTPException, Header
from app.core.config import settings


def hash_content(data: bytes | str) -> str:
    """Compute SHA-256 hash of bytes or string."""
    if isinstance(data, str):
        data = data.encode("utf-8")
    return hashlib.sha256(data).hexdigest()


def generate_report_hash(report_id: str, content_hash: str, signer_id: str) -> str:
    """Generate deterministic HMAC signature for report verification."""
    message = f"{report_id}:{content_hash}:{signer_id}".encode("utf-8")
    key = settings.report_hash_secret.encode("utf-8")
    return hmac.new(key, message, hashlib.sha256).hexdigest()


def verify_report_hash(report_id: str, content_hash: str, signer_id: str, provided_hash: str) -> bool:
    expected = generate_report_hash(report_id, content_hash, signer_id)
    return hmac.compare_digest(expected, provided_hash)


def decode_access_token(token: str) -> Optional[dict]:
    """Decode JWT token (with or without signature verification for dev fallback)."""
    try:
        import jwt
        # First try verifying with internal jwt_secret
        try:
            return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        except Exception:
            # Fallback: decode claims without signature verification (Supabase JWT)
            return jwt.decode(token, options={"verify_signature": False})
    except Exception:
        return None


async def get_token_from_header(authorization: str = Header(...)) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    return authorization[7:]


async def validate_supabase_token(token: str) -> dict:
    """Validate token with Supabase and return user data."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{settings.supabase_url}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": settings.supabase_anon_key,
                },
                timeout=5.0
            )
            if response.status_code == 200:
                return response.json()
        except Exception:
            pass
    
    # Fallback to token claims
    claims = decode_access_token(token)
    if claims:
        return {
            "id": claims.get("sub", ""),
            "email": claims.get("email", ""),
            "user_metadata": claims.get("user_metadata", {}),
        }
    raise HTTPException(status_code=401, detail="Invalid or expired token")
