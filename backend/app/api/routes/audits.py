from typing import Optional, List, Any
from fastapi import APIRouter, HTTPException, Body
from app.services.audit_service import audit_service
from app.services.supabase_service import supabase_service
from app.services.report_service import report_service
from app.schemas.audit import AuditCreate, AuditUpdate, AuditClauseAdd
from app.schemas.report import ReportCreate
from app.api.deps import CurrentUser

router = APIRouter(prefix="/audits", tags=["audits"])


@router.get("")
async def list_audits(user: CurrentUser, status: Optional[str] = None):
    org_id = user.get("organization_id") or user.get("id", "")
    return await audit_service.list_audits(org_id, status)


@router.post("", status_code=201)
async def create_audit(data: AuditCreate, user: CurrentUser):
    org_id = user.get("organization_id") or user.get("id", "")
    return await audit_service.create_audit(data, user["id"], org_id)


@router.get("/{audit_id}")
async def get_audit(audit_id: str, user: CurrentUser):
    audit = await audit_service.get_audit(audit_id)
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    return audit


@router.patch("/{audit_id}")
async def update_audit(audit_id: str, data: AuditUpdate, user: CurrentUser):
    return await audit_service.update_audit(audit_id, data)


@router.delete("/{audit_id}", status_code=204)
async def delete_audit(audit_id: str, user: CurrentUser):
    await audit_service.delete_audit(audit_id)


@router.post("/{audit_id}/clauses")
async def add_audit_clauses(audit_id: str, data: Any = Body(...), user: CurrentUser = None):
    audit = await audit_service.get_audit(audit_id)
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    org_id = user.get("organization_id") or user.get("id", "")
    
    # Accept either { clause_ids: [...] } or [ { clause_id: "..." }, ... ] or [ "id1", "id2" ]
    cids: list[str] = []
    if isinstance(data, dict):
        if "clause_ids" in data:
            cids = data["clause_ids"]
        elif "clause_id" in data:
            cids = [data["clause_id"]]
    elif isinstance(data, list):
        for item in data:
            if isinstance(item, dict):
                cids.append(item.get("clause_id", ""))
            elif isinstance(item, str):
                cids.append(item)
    
    clause_records = [
        {
            "audit_id": audit_id,
            "organization_id": org_id,
            "standard_code": audit.get("standard_code", "ISO"),
            "standard_version": audit.get("standard_version", "2017"),
            "clause_id": cid,
            "status": "pending",
        }
        for cid in cids if cid
    ]
    return await supabase_service.add_audit_clauses(clause_records)


@router.get("/{audit_id}/clauses")
async def get_audit_clauses(audit_id: str, user: CurrentUser):
    return await supabase_service.get_audit_clauses(audit_id)


@router.post("/{audit_id}/run")
async def run_audit(audit_id: str, user: CurrentUser):
    """Execute full audit evaluation against uploaded documents."""
    org_id = user.get("organization_id") or user.get("id", "")
    try:
        # Run bulk assessment across all selected clauses
        clauses = await supabase_service.get_audit_clauses(audit_id)
        if not clauses:
            # If no specific clauses chosen, use standard's clauses
            audit = await supabase_service.get_audit(audit_id)
            std_id = audit.get("standard_code", "ISO17025:2017")
            results = await audit_service.bulk_assess_standard(
                audit_id=audit_id,
                standard_id=std_id,
                organization_id=org_id,
                auto_create_findings=True,
            )
        else:
            results = []
            for cl in clauses:
                res = await audit_service.assess_clause_against_documents(
                    clause_id=cl["clause_id"],
                    audit_id=audit_id,
                    organization_id=org_id,
                )
                results.append(res)
        
        # Calculate updated score
        score = await supabase_service.calculate_audit_score(audit_id)
        await supabase_service.update_audit(audit_id, {
            "status": "under_review",
            "overall_score": score
        })
        return {"status": "completed", "evaluated_clauses": len(results), "overall_score": score, "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audit execution failed: {str(e)}")


@router.get("/{audit_id}/findings")
async def get_audit_findings(audit_id: str, user: CurrentUser):
    return await supabase_service.list_findings(audit_id)


@router.post("/{audit_id}/report")
async def generate_audit_report(audit_id: str, user: CurrentUser):
    audit = await audit_service.get_audit(audit_id)
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    report_data = ReportCreate(
        audit_id=audit_id,
        title=f"Audit Report - {audit.get('name', 'ISO Audit')}",
    )
    report = await report_service.create_report(report_data, user["id"])
    return report


@router.get("/{audit_id}/logs")
async def get_audit_logs(audit_id: str, user: CurrentUser):
    res = supabase_service.client.table("audit_logs").select("*").eq("audit_id", audit_id).order("created_at", desc=True).execute()
    return res.data or []
