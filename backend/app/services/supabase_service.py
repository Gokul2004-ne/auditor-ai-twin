from __future__ import annotations

import logging
import uuid
from typing import Any, Optional
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger(__name__)


class SupabaseService:
    def __init__(self, cfg=None):
        c = cfg or settings
        self.client: Client = create_client(c.supabase_url, c.supabase_service_role_key)
        self.anon_client: Client = create_client(c.supabase_url, c.supabase_anon_key)

    async def get_profile_by_auth_id(self, auth_user_id: str) -> dict | None:
        try:
            res = self.client.table("profiles").select("*").eq("auth_user_id", auth_user_id).execute()
            return res.data[0] if res.data else None
        except Exception as e:
            logger.error(f"Error fetching profile: {e}")
            return None

    async def get_user_organizations(self, profile_id: str) -> list:
        try:
            res = self.client.table("organization_members").select("*, organizations(*)").eq("user_id", profile_id).execute()
            return res.data or []
        except Exception as e:
            logger.error(f"Error fetching orgs: {e}")
            return []

    # Audits
    async def create_audit(self, data: dict) -> dict:
        data = {k: v for k, v in data.items() if v is not None}
        res = self.client.table("audits").insert(data).execute()
        return res.data[0] if res.data else data

    async def get_audit(self, audit_id: str, organization_id: str = None) -> dict | None:
        q = self.client.table("audits").select("*").eq("id", audit_id)
        if organization_id:
            q = q.eq("organization_id", organization_id)
        res = q.execute()
        return res.data[0] if res.data else None

    async def list_audits(self, organization_id: str = None, status: str = None) -> list:
        q = self.client.table("audits").select("*")
        if organization_id:
            q = q.eq("organization_id", organization_id)
        if status:
            q = q.eq("status", status)
        res = q.order("created_at", desc=True).execute()
        return res.data or []

    async def get_audits(self, organization_id: str) -> list:
        return await self.list_audits(organization_id)

    async def update_audit(self, audit_id: str, data: dict) -> dict:
        data = {k: v for k, v in data.items() if v is not None}
        res = self.client.table("audits").update(data).eq("id", audit_id).execute()
        return res.data[0] if res.data else {}

    async def update_audit_status(self, audit_id: str, status: str):
        self.client.table("audits").update({"status": status}).eq("id", audit_id).execute()

    async def delete_audit(self, audit_id: str) -> bool:
        self.client.table("audits").delete().eq("id", audit_id).execute()
        return True

    # Audit clauses
    async def add_audit_clauses(self, clauses: list[dict]) -> list:
        if not clauses:
            return []
        res = self.client.table("audit_clauses").insert(clauses).execute()
        return res.data or []

    async def get_audit_clauses(self, audit_id: str) -> list:
        res = self.client.table("audit_clauses").select("*").eq("audit_id", audit_id).execute()
        return res.data or []

    # Documents
    async def create_document(self, data: dict) -> dict:
        data = {k: v for k, v in data.items() if v is not None}
        res = self.client.table("documents").insert(data).execute()
        return res.data[0] if res.data else data

    async def get_document(self, document_id: str) -> dict | None:
        res = self.client.table("documents").select("*").eq("id", document_id).execute()
        return res.data[0] if res.data else None

    async def list_documents(self, audit_id: str) -> list:
        res = self.client.table("documents").select("*").eq("audit_id", audit_id).execute()
        return res.data or []

    async def update_document(self, doc_id: str, data: dict) -> dict:
        data = {k: v for k, v in data.items() if v is not None}
        res = self.client.table("documents").update(data).eq("id", doc_id).execute()
        return res.data[0] if res.data else {}

    async def update_document_status(self, doc_id: str, status: str):
        self.client.table("documents").update({"processing_status": status}).eq("id", doc_id).execute()

    async def update_document_page_count(self, doc_id: str, count: int):
        self.client.table("documents").update({"page_count": count}).eq("id", doc_id).execute()

    # Findings
    async def create_finding(self, data: dict = None, **kwargs) -> dict:
        payload = dict(data or kwargs)
        if "id" not in payload:
            payload["id"] = str(uuid.uuid4())
        if "summary" not in payload and "title" in payload:
            payload["summary"] = payload["title"]
        if "reasoning" not in payload and "description" in payload:
            payload["reasoning"] = payload["description"]
        if "status" not in payload:
            payload["status"] = "needs_review"

        allowed = {
            "id", "organization_id", "audit_id", "audit_clause_id", "status",
            "ai_status", "auditor_status", "confidence", "summary", "reasoning",
            "missing_evidence", "recommendation", "ai_generated", "reviewed_by", "reviewed_at"
        }
        filtered = {k: v for k, v in payload.items() if k in allowed and v is not None}
        res = self.client.table("audit_findings").insert(filtered).execute()
        return res.data[0] if res.data else payload

    async def get_finding(self, finding_id: str) -> dict | None:
        res = self.client.table("audit_findings").select("*, audit_clauses(*), audit_evidence(*)").eq("id", finding_id).execute()
        return res.data[0] if res.data else None

    async def list_findings(self, audit_id: str, severity: str = None, status: str = None) -> list:
        q = self.client.table("audit_findings").select("*, audit_clauses(clause_id, standard_code), audit_evidence(*)").eq("audit_id", audit_id)
        if status:
            q = q.eq("status", status)
        res = q.order("created_at").execute()
        return res.data or []

    async def get_findings(self, audit_id: str, organization_id: str = None) -> list:
        return await self.list_findings(audit_id)

    async def update_finding(self, finding_id: str, data: dict, organization_id: str = None) -> dict:
        allowed = {
            "status", "ai_status", "auditor_status", "confidence", "summary",
            "reasoning", "missing_evidence", "recommendation", "reviewed_by", "reviewed_at"
        }
        filtered = {k: v for k, v in data.items() if k in allowed and v is not None}
        q = self.client.table("audit_findings").update(filtered).eq("id", finding_id)
        if organization_id:
            q = q.eq("organization_id", organization_id)
        res = q.execute()
        return res.data[0] if res.data else {}

    async def delete_finding(self, finding_id: str) -> bool:
        self.client.table("audit_findings").delete().eq("id", finding_id).execute()
        return True

    # Evidence
    async def create_evidence(self, **kwargs) -> str:
        ev_id = str(uuid.uuid4())
        allowed = {"id", "organization_id", "audit_id", "finding_id", "document_id", "page_number", "section_title", "text_excerpt", "qdrant_point_id", "similarity_score"}
        filtered = {k: v for k, v in kwargs.items() if k in allowed and v is not None}
        filtered["id"] = ev_id
        self.client.table("audit_evidence").insert(filtered).execute()
        return ev_id

    async def calculate_audit_score(self, audit_id: str) -> float:
        findings = self.client.table("audit_findings").select("ai_status, auditor_status").eq("audit_id", audit_id).execute()
        weights = {"compliant": 1.0, "partially_compliant": 0.5, "non_compliant": 0.0}
        eligible = []
        for f in (findings.data or []):
            st = f.get('auditor_status') or f.get('ai_status', 'needs_review')
            if st in weights:
                eligible.append(weights[st])
        if not eligible:
            return 0.0
        return round(sum(eligible) / len(eligible) * 100, 2)

    # Reports
    async def create_report(self, data: dict) -> dict:
        allowed = {"id", "organization_id", "audit_id", "status", "current_version", "finalized_at"}
        filtered = {k: v for k, v in data.items() if k in allowed and v is not None}
        if "current_version" not in filtered:
            filtered["current_version"] = data.get("version", 1)
        res = self.client.table("reports").insert(filtered).execute()
        report = res.data[0] if res.data else filtered

        # Also insert initial version in report_versions
        v_data = {
            "report_id": report["id"],
            "version": report.get("current_version", 1),
            "content": data,
        }
        if data.get("created_by") and len(str(data.get("created_by"))) == 36:
            v_data["created_by"] = data.get("created_by")
        try:
            self.client.table("report_versions").insert(v_data).execute()
        except Exception as e:
            logger.warning(f"Could not insert report_version: {e}")

        # Return merged dict
        return {**data, **report}

    async def get_report(self, report_id: str, organization_id: str = None) -> dict | None:
        q = self.client.table("reports").select("*, digital_signatures(*)").eq("id", report_id)
        if organization_id:
            q = q.eq("organization_id", organization_id)
        res = q.execute()
        if not res.data:
            return None
        report = res.data[0]
        # Fetch latest version content
        try:
            ver = self.client.table("report_versions").select("content").eq("report_id", report_id).order("version", desc=True).limit(1).execute()
            if ver.data and ver.data[0].get("content"):
                return {**ver.data[0]["content"], **report}
        except Exception:
            pass
        return report

    async def list_reports(self, audit_id: str) -> list:
        res = self.client.table("reports").select("*").eq("audit_id", audit_id).order("created_at", desc=True).execute()
        return res.data or []

    async def update_report(self, report_id: str, data: dict) -> dict:
        allowed = {"status", "current_version", "finalized_at", "organization_id"}
        filtered = {k: v for k, v in data.items() if k in allowed and v is not None}
        res = self.client.table("reports").update(filtered).eq("id", report_id).execute()
        extra = {k: v for k, v in data.items() if k not in allowed and v is not None}
        if extra:
            try:
                ver = self.client.table("report_versions").select("id, content").eq("report_id", report_id).order("version", desc=True).limit(1).execute()
                if ver.data:
                    curr_content = ver.data[0].get("content") or {}
                    curr_content.update(extra)
                    self.client.table("report_versions").update({"content": curr_content}).eq("id", ver.data[0]["id"]).execute()
            except Exception:
                pass
        return res.data[0] if res.data else {}

    async def create_report_version(self, data: dict) -> dict:
        data = {k: v for k, v in data.items() if v is not None}
        res = self.client.table("report_versions").insert(data).execute()
        return res.data[0] if res.data else data

    async def get_report_versions(self, report_id: str) -> list:
        res = self.client.table("report_versions").select("*").eq("report_id", report_id).order("version").execute()
        return res.data or []

    async def create_signature(self, data: dict) -> dict:
        data = {k: v for k, v in data.items() if v is not None}
        res = self.client.table("digital_signatures").insert(data).execute()
        return res.data[0] if res.data else data

    async def log_action(self, **kwargs):
        try:
            data = {k: v for k, v in kwargs.items() if v is not None}
            self.client.table("audit_logs").insert(data).execute()
        except Exception as e:
            logger.error(f"Failed to log action: {e}")

    # Storage
    async def upload_file(self, bucket: str, path: str, data: bytes, content_type: str = "application/pdf") -> str:
        self.client.storage.from_(bucket).upload(path, data, file_options={"content-type": content_type, "upsert": "true"})
        return f"{settings.supabase_url}/storage/v1/object/public/{bucket}/{path}"

    async def download_file(self, bucket: str, path: str) -> bytes:
        return self.client.storage.from_(bucket).download(path)

    async def get_signed_url(self, bucket: str, path: str, expires_in: int = 3600) -> str:
        result = self.client.storage.from_(bucket).create_signed_url(path, expires_in)
        return result['signedURL']

    def health_check(self) -> bool:
        try:
            self.client.table("organizations").select("id").limit(1).execute()
            return True
        except Exception:
            return False


supabase_service = SupabaseService(settings)
