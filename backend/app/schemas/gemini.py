from pydantic import BaseModel, Field
from typing import Literal, Optional, Any


class EvidenceReference(BaseModel):
    document_id: str = ""
    page: int = 0
    section: str = ""
    quote_reference: str = ""


class GeminiAuditResponse(BaseModel):
    clause_id: str
    status: Literal["compliant", "partially_compliant", "non_compliant", "not_applicable", "needs_review"] = "needs_review"
    confidence: float = Field(default=0.85, ge=0.0, le=1.0)
    summary: str = ""
    reasoning: str = ""
    evidence: list[EvidenceReference] = []
    missing_evidence: list[str] = []
    recommendations: list[str] = []
    requires_human_review: bool = True


class AuditAssessmentRequest(BaseModel):
    clause_ref: str
    clause_title: str = ""
    clause_text: str = ""
    evidence_chunks: list[str] = []
    organization_context: Optional[str] = None


class AssessmentDetail(BaseModel):
    conformance: str = "conforming"
    confidence: float = 0.9
    findings: list[str] = []
    recommendations: list[str] = []
    severity: Optional[str] = "minor"


class AssessmentResponse(BaseModel):
    assessment: AssessmentDetail
    model_used: str = "gemini-2.5-flash"
    prompt_tokens: int = 100
    completion_tokens: int = 50
