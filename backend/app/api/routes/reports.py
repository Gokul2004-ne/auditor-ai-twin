from datetime import datetime, timezone
import hashlib
from fastapi import APIRouter, HTTPException, Response, Body
from app.services.report_service import report_service
from app.services.signature_service import signature_service
from app.services.supabase_service import supabase_service
from app.schemas.report import ReportCreate, ReportUpdate, SignatureRequest
from app.api.deps import CurrentUser

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("")
async def list_reports(audit_id: str, user: CurrentUser):
    return await report_service.list_reports(audit_id)


@router.post("", status_code=201)
async def create_report(data: ReportCreate, user: CurrentUser):
    return await report_service.create_report(data, user["id"])


@router.get("/{report_id}")
async def get_report(report_id: str, user: CurrentUser):
    report = await report_service.get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.patch("/{report_id}")
async def update_report(report_id: str, data: ReportUpdate, user: CurrentUser):
    report = await report_service.get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Save a version before updating
    existing_versions = await supabase_service.get_report_versions(report_id)
    next_ver = len(existing_versions) + 1
    await supabase_service.create_report_version({
        "report_id": report_id,
        "version": next_ver,
        "content": report,
        "created_by": user["id"],
    })
    
    updated = await report_service.update_report(report_id, data)
    org_id = user.get("organization_id") or user.get("id", "")
    await supabase_service.log_action(
        organization_id=org_id,
        audit_id=report.get("audit_id"),
        user_id=user["id"],
        action="report_edited",
        entity_type="report",
        entity_id=report_id,
        after_data=data.model_dump(),
    )
    return updated


@router.get("/{report_id}/versions")
async def get_report_versions(report_id: str, user: CurrentUser):
    return await supabase_service.get_report_versions(report_id)


@router.post("/{report_id}/finalize")
async def finalize_report(report_id: str, user: CurrentUser):
    report = await report_service.get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Generate PDF
    pdf_bytes = await report_service.generate_pdf(report_id)
    sha256_hash = hashlib.sha256(pdf_bytes).hexdigest()
    
    # Update status to finalized
    updated = await supabase_service.update_report(report_id, {
        "status": "finalized",
        "finalized_at": datetime.now(timezone.utc).isoformat(),
        "content_hash": sha256_hash,
    })
    
    org_id = user.get("organization_id") or user.get("id", "")
    await supabase_service.log_action(
        organization_id=org_id,
        audit_id=report.get("audit_id"),
        user_id=user["id"],
        action="report_finalized",
        entity_type="report",
        entity_id=report_id,
        after_data={"sha256": sha256_hash},
    )
    return {"status": "finalized", "report": updated, "sha256": sha256_hash}


@router.post("/{report_id}/sign")
async def sign_report(report_id: str, request: SignatureRequest, user: CurrentUser):
    request.report_id = report_id
    signed_res = await signature_service.attach_signature_to_report(request)
    
    report = await report_service.get_report(report_id)
    org_id = user.get("organization_id") or user.get("id", "")
    await supabase_service.update_audit(report.get("audit_id"), {"status": "signed"})
    await supabase_service.log_action(
        organization_id=org_id,
        audit_id=report.get("audit_id"),
        user_id=user["id"],
        action="report_signed",
        entity_type="report",
        entity_id=report_id,
        after_data=signed_res,
    )
    return signed_res


@router.get("/{report_id}/pdf")
async def download_pdf(report_id: str, user: CurrentUser):
    pdf_bytes = await report_service.generate_pdf(report_id)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="report-{report_id}.pdf"'},
    )


@router.get("/{report_id}/verify")
async def verify_report(report_id: str, code: str = ""):
    return await report_service.verify_report(report_id, code or "")
