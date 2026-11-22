from pydantic import BaseModel, UUID4
from typing import Optional, Literal
from datetime import datetime


class AuditCreate(BaseModel):
    name: str
    standard_code: str
    standard_version: str
    organization_id: Optional[str] = None


class AuditUpdate(BaseModel):
    name: Optional[str] = None
    standard_code: Optional[str] = None
    standard_version: Optional[str] = None
    status: Optional[str] = None
    overall_score: Optional[float] = None
    completed_at: Optional[datetime] = None
    workflow_status: Optional[str] = None
    resend_count: Optional[int] = None
    rebind_count: Optional[int] = None
    last_rejected_clause: Optional[str] = None
    last_rejected_clause_index: Optional[int] = None
    resend_statement: Optional[str] = None
    corrective_recommendation: Optional[str] = None
    rca_8delta: Optional[dict] = None
    notes: Optional[str] = None


class AuditClauseAdd(BaseModel):
    clause_ids: list[str]


class FindingUpdate(BaseModel):
    auditor_status: Optional[Literal["compliant","partially_compliant","non_compliant","not_applicable","needs_review"]] = None
    summary: Optional[str] = None
    reasoning: Optional[str] = None
    recommendation: Optional[str] = None


class FindingAccept(BaseModel):
    notes: Optional[str] = None


class FindingReject(BaseModel):
    reason: str
