from __future__ import annotations

from typing import Annotated, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.security import decode_access_token
from app.services.supabase_service import supabase_service

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)],
) -> dict:
    """Extract user info from JWT or Supabase token, resolving profile & organization."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    claims = decode_access_token(token)
    if not claims:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    auth_id = claims.get("sub", "")
    email = claims.get("email", "")
    org_id = claims.get("organization_id", "")

    # Look up internal profile
    profile = await supabase_service.get_profile_by_auth_id(auth_id)
    profile_id = profile["id"] if profile else auth_id

    if not org_id:
        if profile:
            orgs = await supabase_service.get_user_organizations(profile["id"])
            if orgs:
                org_id = orgs[0]["organization_id"]
        if not org_id:
            default_org = supabase_service.client.table("organizations").select("id").limit(1).execute()
            if default_org.data:
                org_id = default_org.data[0]["id"]

    return {
        "id": profile_id,
        "auth_user_id": auth_id,
        "email": email,
        "organization_id": org_id,
    }


CurrentUser = Annotated[dict, Depends(get_current_user)]
