from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Body
from app.services.audit_service import audit_service
from app.services.supabase_service import supabase_service
from app.schemas.finding import FindingCreate, FindingUpdate
from app.api.deps import CurrentUser

router = APIRouter(prefix="/findings", tags=["findings"])


@router.get("")
async def list_findings(
    audit_id: str,
    severity: str = None,
    status: str = None,
    user: CurrentUser = None,
):
    return await supabase_service.list_findings(audit_id, severity, status)


@router.post("", status_code=201)
async def create_finding(data: FindingCreate, user: CurrentUser):
    return await audit_service.create_finding(data, user["id"])


@router.get("/{finding_id}")
async def get_finding(finding_id: str, user: CurrentUser):
    finding = await audit_service.get_finding(finding_id)
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    return finding


@router.patch("/{finding_id}")
async def update_finding(finding_id: str, data: FindingUpdate, user: CurrentUser):
    org_id = user.get("organization_id") or user.get("id", "")
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["reviewed_by"] = user["id"]
    update_data["reviewed_at"] = datetime.now(timezone.utc).isoformat()
    res = await supabase_service.update_finding(finding_id, update_data, organization_id=org_id)
    await supabase_service.log_action(
        organization_id=org_id,
        user_id=user["id"],
        action="finding_edited",
        entity_type="finding",
        entity_id=finding_id,
        after_data=update_data,
    )
    return res


@router.post("/{finding_id}/accept")
async def accept_finding(finding_id: str, user: CurrentUser):
    finding = await audit_service.get_finding(finding_id)
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    org_id = user.get("organization_id") or user.get("id", "")
    
    update_data = {
        "status": "compliant",
        "auditor_status": "compliant",
        "reviewed_by": user["id"],
        "reviewed_at": datetime.now(timezone.utc).isoformat(),
    }
    updated = await supabase_service.update_finding(finding_id, update_data, organization_id=org_id)
    await supabase_service.log_action(
        organization_id=org_id,
        audit_id=finding.get("audit_id"),
        user_id=user["id"],
        action="finding_accepted",
        entity_type="finding",
        entity_id=finding_id,
        after_data=update_data,
    )
    return updated


@router.post("/{finding_id}/reject")
async def reject_finding(
    finding_id: str,
    user: CurrentUser,
    reason: str = Body(default="Auditor rejected finding", embed=True),
):
    finding = await audit_service.get_finding(finding_id)
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    org_id = user.get("organization_id") or user.get("id", "")

    update_data = {
        "status": "non_compliant",
        "auditor_status": "non_compliant",
        "reasoning": reason,
        "reviewed_by": user["id"],
        "reviewed_at": datetime.now(timezone.utc).isoformat(),
    }
    updated = await supabase_service.update_finding(finding_id, update_data, organization_id=org_id)
    await supabase_service.log_action(
        organization_id=org_id,
        audit_id=finding.get("audit_id"),
        user_id=user["id"],
        action="finding_rejected",
        entity_type="finding",
        entity_id=finding_id,
        after_data={"reason": reason},
    )
    return updated


@router.delete("/{finding_id}", status_code=204)
async def delete_finding(finding_id: str, user: CurrentUser):
    await audit_service.delete_finding(finding_id)
