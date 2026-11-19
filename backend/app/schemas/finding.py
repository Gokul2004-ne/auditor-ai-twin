from pydantic import BaseModel
from typing import Optional, Literal


class FindingCreate(BaseModel):
    audit_id: str
    audit_clause_id: Optional[str] = None
    clause_id: Optional[str] = None
    clause_ref: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = "minor"
    recommendation: Optional[str] = None
    status: Optional[str] = "open"
    ai_status: Optional[str] = None
    summary: Optional[str] = None
    reasoning: Optional[str] = None
    confidence: Optional[float] = None


class FindingUpdate(BaseModel):
    auditor_status: Optional[Literal["compliant","partially_compliant","non_compliant","not_applicable","needs_review"]] = None
    status: Optional[str] = None
    summary: Optional[str] = None
    reasoning: Optional[str] = None
    recommendation: Optional[str] = None
    severity: Optional[str] = None


class FindingResponse(BaseModel):
    id: str
    audit_id: str
    organization_id: Optional[str] = None
    audit_clause_id: Optional[str] = None
    ai_status: Optional[str] = None
    auditor_status: Optional[str] = None
    status: str
    confidence: Optional[float] = None
    summary: Optional[str] = None
    reasoning: Optional[str] = None
    missing_evidence: Optional[str] = None
    recommendation: Optional[str] = None
    ai_generated: bool = True
    requires_human_review: bool = True
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
