from pydantic import BaseModel
from typing import Optional, Any, List
from datetime import datetime, timezone


class ReportContentSection(BaseModel):
    executive_summary: str = ""
    scope: str = ""
    documents_reviewed: list[str] = []
    clause_findings: list[dict] = []
    non_conformities: list[dict] = []
    observations: list[str] = []
    corrective_actions: list[str] = []
    risk_summary: str = ""
    auditor_conclusion: str = ""


class ReportCreate(BaseModel):
    audit_id: str
    title: Optional[str] = "Audit Assessment Report"
    executive_summary: Optional[str] = None
    methodology: Optional[str] = None
    include_finding_ids: Optional[List[str]] = None


class ReportUpdate(BaseModel):
    title: Optional[str] = None
    executive_summary: Optional[str] = None
    methodology: Optional[str] = None
    content: Optional[dict] = None
    status: Optional[str] = None


class SignatureCreate(BaseModel):
    signer_name: str
    signer_role: str
    signature_type: str = "drawn"
    signature_data: Optional[str] = None  # base64 for drawn/uploaded


class SignatureRequest(BaseModel):
    report_id: Optional[str] = None
    signer_name: str
    signer_title: Optional[str] = "Lead Auditor"
    signer_email: Optional[str] = "auditor@iso-twin.org"
    signature_data: str  # base64
    timestamp: datetime = datetime.now(timezone.utc)
