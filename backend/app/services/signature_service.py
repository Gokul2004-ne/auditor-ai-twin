from __future__ import annotations

import base64
import io
import logging
from datetime import datetime, timezone
from typing import Any, Optional

from app.services.supabase_service import supabase_service
from app.schemas.report import SignatureRequest

logger = logging.getLogger("audit_twin.signature")


class SignatureService:
    async def attach_signature_to_report(
        self, request: SignatureRequest
    ) -> dict[str, Any]:
        """Attach a digital signature to a PDF report and return signed PDF."""
        report = await supabase_service.get_report(request.report_id)
        if not report:
            raise ValueError(f"Report {request.report_id} not found")

        if report.get("is_signed"):
            raise ValueError("Report is already signed")

        # Decode signature image
        try:
            sig_bytes = base64.b64decode(request.signature_data)
        except Exception as e:
            raise ValueError(f"Invalid signature data: {e}")

        # Try to get existing PDF and stamp signature
        signed_pdf_bytes = await self._stamp_signature_on_pdf(
            report=report,
            sig_bytes=sig_bytes,
            signer_name=request.signer_name,
            signer_title=request.signer_title,
            signer_email=request.signer_email,
            timestamp=request.timestamp,
        )

        # Upload signed PDF
        report_id = request.report_id
        signed_path = f"{report.get('organization_id', 'org')}/{report_id}/signed_v{report.get('version', 1)}.pdf"
        try:
            signed_url = await supabase_service.upload_file(
                "audit-reports", signed_path, signed_pdf_bytes, "application/pdf"
            )
        except Exception as e:
            logger.warning(f"Signed PDF upload failed: {e}")
            signed_url = None

        import hashlib
        report_sha256 = hashlib.sha256(signed_pdf_bytes).hexdigest()

        # Insert record into digital_signatures table
        try:
            await supabase_service.create_signature({
                "organization_id": report.get("organization_id"),
                "report_id": report_id,
                "report_version": report.get("current_version", 1),
                "signer_name": request.signer_name,
                "signer_role": request.signer_title,
                "signature_type": getattr(request, "signature_type", "drawn"),
                "signature_storage_path": signed_url,
                "report_sha256": report_sha256,
                "signed_at": (request.timestamp or datetime.now(timezone.utc)).isoformat(),
            })
        except Exception as e:
            logger.error(f"Failed to record digital signature: {e}")

        # Update report status
        updated = await supabase_service.update_report(report_id, {
            "status": "signed",
            "report_sha256": report_sha256,
        })

        return {
            "report_id": report_id,
            "signed": True,
            "signer_name": request.signer_name,
            "signer_role": request.signer_title,
            "signed_at": (request.timestamp or datetime.now(timezone.utc)).isoformat(),
            "report_sha256": report_sha256,
            "signed_pdf_url": signed_url,
        }

    async def _stamp_signature_on_pdf(
        self,
        report: dict[str, Any],
        sig_bytes: bytes,
        signer_name: str,
        signer_title: str,
        signer_email: str,
        timestamp: datetime,
    ) -> bytes:
        """Stamp a signature image onto the last page of the PDF."""
        try:
            import fitz  # PyMuPDF
        except ImportError:
            raise RuntimeError("PyMuPDF not installed")

        # Try to get existing PDF
        pdf_bytes = None
        if report.get("pdf_url"):
            try:
                import httpx
                async with httpx.AsyncClient() as client:
                    resp = await client.get(report["pdf_url"], timeout=30)
                    if resp.status_code == 200:
                        pdf_bytes = resp.content
            except Exception as e:
                logger.warning(f"Could not fetch existing PDF: {e}")

        if not pdf_bytes:
            # Create a minimal PDF with signature page
            from reportlab.lib.pagesizes import A4
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
            from reportlab.lib.styles import getSampleStyleSheet
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4)
            styles = getSampleStyleSheet()
            story = [
                Paragraph(report.get("title", "Audit Report"), styles["Title"]),
                Spacer(1, 50),
                Paragraph("Digital Signature Page", styles["Heading1"]),
            ]
            doc.build(story)
            pdf_bytes = buffer.getvalue()

        # Open PDF and add signature
        pdf_doc = fitz.open(stream=pdf_bytes, filetype="pdf")

        # Add a new signature page
        sig_page = pdf_doc.new_page(width=595, height=842)  # A4

        # Signature block text
        sig_text = f"""DIGITAL SIGNATURE

Signed by: {signer_name}
Title: {signer_title}
Email: {signer_email}
Date: {timestamp.strftime('%Y-%m-%d %H:%M:%S UTC')}
Document: {report.get('title', 'Audit Report')} v{report.get('version', 1)}
"""
        sig_page.insert_text((50, 100), sig_text, fontsize=12, color=(0, 0, 0))

        # Insert signature image
        try:
            sig_rect = fitz.Rect(50, 300, 350, 420)
            sig_page.insert_image(sig_rect, stream=sig_bytes)
        except Exception as e:
            logger.warning(f"Could not insert signature image: {e}")

        # Stamp "SIGNED" watermark
        sig_page.insert_text(
            (150, 700), "DIGITALLY SIGNED", fontsize=36,
            color=(0.2, 0.6, 0.2), rotate=0
        )

        output_buffer = io.BytesIO()
        pdf_doc.save(output_buffer)
        pdf_doc.close()

        return output_buffer.getvalue()


signature_service = SignatureService()
