from __future__ import annotations

import hashlib
import io
import json
import logging
from datetime import datetime, timezone
from typing import Any, Optional

from app.core.config import settings
from app.core.security import hash_content, generate_report_hash
from app.services.supabase_service import supabase_service
from app.services.gemini_service import gemini_service
from app.schemas.report import ReportCreate, ReportUpdate

logger = logging.getLogger("audit_twin.report")


class ReportService:
    async def create_report(self, data: ReportCreate, user_id: str) -> dict[str, Any]:
        # Get all findings for this audit (or specific ones)
        from app.services.supabase_service import supabase_service as sb
        all_findings = await sb.list_findings(data.audit_id)

        if data.include_finding_ids:
            findings = [f for f in all_findings if f["id"] in data.include_finding_ids]
        else:
            findings = all_findings

        # Get version number and org_id
        existing_reports = await sb.list_reports(data.audit_id)
        version = len(existing_reports) + 1
        audit = await sb.get_audit(data.audit_id)
        org_id = audit.get("organization_id") if audit else None

        report_dict = {
            "organization_id": org_id,
            "audit_id": data.audit_id,
            "title": data.title,
            "version": version,
            "status": "draft",
            "executive_summary": data.executive_summary,
            "methodology": data.methodology,
            "finding_count": len(findings),
            "finding_ids": [f["id"] for f in findings],
            "created_by": user_id,
        }

        return await sb.create_report(report_dict)

    async def get_report(self, report_id: str) -> Optional[dict[str, Any]]:
        return await supabase_service.get_report(report_id)

    async def list_reports(self, audit_id: str) -> list[dict[str, Any]]:
        return await supabase_service.list_reports(audit_id)

    async def update_report(self, report_id: str, data: ReportUpdate) -> dict[str, Any]:
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        return await supabase_service.update_report(report_id, update_dict)

    async def generate_executive_summary(
        self, report_id: str, audit_id: str, organization_name: str
    ) -> str:
        """Use Gemini to auto-generate executive summary."""
        from app.services.supabase_service import supabase_service as sb
        audit = await sb.get_audit(audit_id)
        findings = await sb.list_findings(audit_id)

        # Summarize findings for the AI
        findings_summary = [
            {
                "clause_ref": f.get("clause_ref"),
                "severity": f.get("severity"),
                "status": f.get("status"),
                "title": f.get("title"),
            }
            for f in findings
        ]

        standard_name = audit.get("standard_name", audit.get("standard_id", "ISO Standard"))
        summary = await gemini_service.generate_executive_summary(
            audit_title=audit.get("title", "Audit"),
            standard_name=standard_name,
            findings_summary=findings_summary,
            organization_name=organization_name,
        )

        await supabase_service.update_report(report_id, {"executive_summary": summary})
        return summary

    async def generate_pdf(self, report_id: str) -> bytes:
        """Generate a PDF report from report data."""
        try:
            from reportlab.lib.pagesizes import A4
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
            from reportlab.lib import colors
            from reportlab.lib.units import cm
        except ImportError:
            raise RuntimeError("reportlab not installed. Run: pip install reportlab")

        report = await supabase_service.get_report(report_id)
        if not report:
            raise ValueError(f"Report {report_id} not found")

        audit = await supabase_service.get_audit(report["audit_id"])
        findings = await supabase_service.list_findings(report["audit_id"])

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm,
                                topMargin=2*cm, bottomMargin=2*cm)
        styles = getSampleStyleSheet()
        story = []

        # Title
        story.append(Paragraph(report.get("title", "Audit Report"), styles["Title"]))
        story.append(Spacer(1, 0.5*cm))
        story.append(Paragraph(f"Version {report.get('version', 1)}", styles["Normal"]))
        story.append(Paragraph(f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}", styles["Normal"]))
        story.append(Spacer(1, 1*cm))

        # Executive Summary
        if report.get("executive_summary"):
            story.append(Paragraph("Executive Summary", styles["Heading1"]))
            story.append(Paragraph(report["executive_summary"], styles["Normal"]))
            story.append(Spacer(1, 0.5*cm))

        # Findings table
        if findings:
            story.append(Paragraph("Findings", styles["Heading1"]))
            table_data = [["Clause Ref", "Title", "Severity", "Status"]]
            for f in findings:
                table_data.append([
                    f.get("clause_ref", ""),
                    f.get("title", "")[:60],
                    f.get("severity", ""),
                    f.get("status", ""),
                ])
            table = Table(table_data, colWidths=[2.5*cm, 10*cm, 2.5*cm, 2.5*cm])
            table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e3a5f")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f0f4f8")]),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("PADDING", (0, 0), (-1, -1), 6),
            ]))
            story.append(table)

        doc.build(story)
        pdf_bytes = buffer.getvalue()

        # Store content hash
        content_hash = hash_content(pdf_bytes)
        verification_code = generate_report_hash(report_id, content_hash, report.get("created_by", ""))
        verification_url = f"{settings.app_url}/verify/{report_id}?code={verification_code}"

        # Upload PDF
        pdf_path = f"{report.get('organization_id', 'org')}/{report_id}/v{report.get('version', 1)}.pdf"
        try:
            pdf_url = await supabase_service.upload_file(
                "audit-reports", pdf_path, pdf_bytes, "application/pdf"
            )
        except Exception as e:
            logger.warning(f"PDF upload failed: {e}")
            pdf_url = None

        await supabase_service.update_report(report_id, {
            "content_hash": content_hash,
            "verification_url": verification_url,
            "pdf_url": pdf_url,
        })

        return pdf_bytes

    async def verify_report(self, report_id: str, code: str) -> dict[str, Any]:
        """Verify report integrity."""
        report = await supabase_service.get_report(report_id)
        if not report:
            return {"valid": False, "reason": "Report not found"}

        content_hash = report.get("content_hash", "")
        created_by = report.get("created_by", "")

        from app.core.security import verify_report_hash
        is_valid = verify_report_hash(report_id, content_hash, created_by, code)

        return {
            "valid": is_valid,
            "report_id": report_id,
            "title": report.get("title"),
            "version": report.get("version"),
            "status": report.get("status"),
            "created_at": report.get("created_at"),
            "is_signed": report.get("is_signed", False),
            "signer_name": report.get("signer_name"),
        }


report_service = ReportService()
