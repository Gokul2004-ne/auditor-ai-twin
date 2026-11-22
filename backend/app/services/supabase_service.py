from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Optional
from supabase import create_client, Client
from app.core.config import settings
from app.services.workflow_state_service import workflow_state_service

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
        try:
            q = self.client.table("audits").select("*").eq("id", audit_id)
            if organization_id:
                q = q.eq("organization_id", organization_id)
            res = q.execute()
            if res.data:
                return workflow_state_service.enrich_audit(res.data[0])
        except Exception as e:
            logger.warning(f"Error getting audit from supabase: {e}")
        # Fallback if DB query fails
        state = workflow_state_service.get_state(audit_id)
        return workflow_state_service.enrich_audit({"id": audit_id, "name": "Audit Engagement", "status": state.get("workflow_status", "under_review")})

    async def list_audits(self, organization_id: str = None, status: str = None) -> list:
        try:
            q = self.client.table("audits").select("*")
            if organization_id:
                q = q.eq("organization_id", organization_id)
            res = q.order("created_at", desc=True).execute()
            audits = res.data or []
            return [workflow_state_service.enrich_audit(a) for a in audits]
        except Exception as e:
            logger.warning(f"Error listing audits from supabase: {e}")
            return []

    async def get_audits(self, organization_id: str) -> list:
        return await self.list_audits(organization_id)

    async def update_audit(self, audit_id: str, data: dict) -> dict:
        data = {k: v for k, v in data.items() if v is not None}
        
        # 1. Update persistent workflow state service first
        workflow_state_service.update_state(audit_id, data)

        # 2. Prepare safe payload for PostgreSQL audits table
        # Allowed columns in DB table:
        allowed_db_columns = {
            "id", "organization_id", "name", "standard_code", "standard_version",
            "status", "overall_score", "created_by", "created_at", "updated_at", "completed_at"
        }
        db_payload = {k: v for k, v in data.items() if k in allowed_db_columns}

        # Validate status against PostgreSQL check constraint (audits_status_check):
        # Allowed: 'draft', 'processing', 'under_review', 'approved', 'signed', 'archived'
        if "status" in db_payload:
            s = db_payload["status"]
            if s not in {"draft", "processing", "under_review", "approved", "signed", "archived"}:
                db_payload["status"] = "under_review"

        db_payload["updated_at"] = datetime.now(timezone.utc).isoformat()

        res_data = {}
        try:
            res = self.client.table("audits").update(db_payload).eq("id", audit_id).execute()
            res_data = res.data[0] if res.data else {}
        except Exception as e:
            logger.warning(f"PostgreSQL update_audit notice (fallback used): {e}")

        # Return merged dict enriched with workflow state
        merged = {**data, **db_payload, **res_data, "id": audit_id}
        return workflow_state_service.enrich_audit(merged)

    async def update_audit_status(self, audit_id: str, status: str):
        await self.update_audit(audit_id, {"status": status})

    async def delete_audit(self, audit_id: str) -> bool:
        try:
            self.client.table("audits").delete().eq("id", audit_id).execute()
            return True
        except Exception as e:
            logger.warning(f"Error deleting audit {audit_id}: {e}")
            return False

    # Audit clauses
    async def add_audit_clauses(self, clauses: list[dict]) -> list:
        if not clauses:
            return []
        try:
            res = self.client.table("audit_clauses").insert(clauses).execute()
            return res.data or []
        except Exception as e:
            logger.warning(f"Error adding audit clauses: {e}")
            return []

    async def get_audit_clauses(self, audit_id: str) -> list:
        try:
            res = self.client.table("audit_clauses").select("*").eq("audit_id", audit_id).execute()
            return res.data or []
        except Exception as e:
            logger.warning(f"Error fetching audit clauses for {audit_id}: {e}")
            return []

    # Documents
    async def create_document(self, data: dict) -> dict:
        data = {k: v for k, v in data.items() if v is not None}
        try:
            res = self.client.table("documents").insert(data).execute()
            return res.data[0] if res.data else data
        except Exception as e:
            logger.warning(f"Error creating document: {e}")
            return data

    async def get_document(self, document_id: str) -> dict | None:
        try:
            res = self.client.table("documents").select("*").eq("id", document_id).execute()
            return res.data[0] if res.data else None
        except Exception as e:
            logger.warning(f"Error fetching document {document_id}: {e}")
            return None

    async def list_documents(self, audit_id: str) -> list:
        try:
            res = self.client.table("documents").select("*").eq("audit_id", audit_id).execute()
            return res.data or []
        except Exception as e:
            logger.warning(f"Error listing documents for {audit_id}: {e}")
            return []

    async def update_document(self, doc_id: str, data: dict) -> dict:
        data = {k: v for k, v in data.items() if v is not None}
        try:
            res = self.client.table("documents").update(data).eq("id", doc_id).execute()
            return res.data[0] if res.data else {}
        except Exception as e:
            logger.warning(f"Error updating document {doc_id}: {e}")
            return {}

    async def update_document_status(self, doc_id: str, status: str):
        try:
            self.client.table("documents").update({"processing_status": status}).eq("id", doc_id).execute()
        except Exception as e:
            logger.warning(f"Error updating document status {doc_id}: {e}")

    async def update_document_page_count(self, doc_id: str, count: int):
        try:
            self.client.table("documents").update({"page_count": count}).eq("id", doc_id).execute()
        except Exception as e:
            logger.warning(f"Error updating document page count {doc_id}: {e}")

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
        try:
            res = self.client.table("audit_findings").select("*, audit_clauses(*), audit_evidence(*)").eq("id", finding_id).execute()
            return res.data[0] if res.data else None
        except Exception as e:
            logger.warning(f"Error fetching finding {finding_id}: {e}")
            return None

    async def list_findings(self, audit_id: str, severity: str = None, status: str = None) -> list:
        try:
            q = self.client.table("audit_findings").select("*, audit_clauses(clause_id, standard_code), audit_evidence(*)").eq("audit_id", audit_id)
            if status:
                q = q.eq("status", status)
            res = q.order("created_at").execute()
            return res.data or []
        except Exception as e:
            logger.warning(f"Error listing findings for audit {audit_id}: {e}")
            return []

    async def get_findings(self, audit_id: str, organization_id: str = None) -> list:
        return await self.list_findings(audit_id)

    async def update_finding(self, finding_id: str, data: dict, organization_id: str = None) -> dict:
        try:
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
        except Exception as e:
            logger.warning(f"Error updating finding {finding_id}: {e}")
            return {}

    async def delete_finding(self, finding_id: str) -> bool:
        try:
            self.client.table("audit_findings").delete().eq("id", finding_id).execute()
            return True
        except Exception as e:
            logger.warning(f"Error deleting finding {finding_id}: {e}")
            return False

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
