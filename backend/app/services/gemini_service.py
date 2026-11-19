import google.generativeai as genai
from app.core.config import settings
from app.schemas.gemini import (
    GeminiAuditResponse,
    AuditAssessmentRequest,
    AssessmentResponse,
    AssessmentDetail,
    EvidenceReference
)
from fastembed import TextEmbedding
import json
import logging
import re

logger = logging.getLogger(__name__)

AUDIT_SYSTEM_PROMPT = """You are an AI audit assistant for ISO standards compliance assessment.

IMPORTANT CONSTRAINTS:
- You are NOT authorized to certify any organization.
- Evaluate ONLY the evidence supplied to you.
- Do NOT invent evidence.
- Do NOT assume missing information exists.
- If there is insufficient evidence, mark the result as needs_review, partially_compliant, or non_compliant.
- Every factual assessment MUST reference evidence from the provided documents.
- Separate: observed evidence, interpretation, missing evidence, and recommendations.
- Do NOT produce a final certification decision.
- Return ONLY valid JSON matching the provided schema.
"""


class GeminiService:
    def __init__(self):
        genai.configure(api_key=settings.gemini_api_key)
        self.model = genai.GenerativeModel(settings.gemini_model)
        self._embedder = None

    @property
    def embedder(self):
        if self._embedder is None:
            self._embedder = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
        return self._embedder

    def configure(self):
        genai.configure(api_key=settings.gemini_api_key)

    def embed_text(self, text: str) -> list[float]:
        """Generate embedding for a single text."""
        embeddings = list(self.embedder.embed([text]))
        return [float(x) for x in embeddings[0]]

    def embed_query(self, query: str) -> list[float]:
        """Generate embedding for a search query."""
        embeddings = list(self.embedder.embed([query]))
        return [float(x) for x in embeddings[0]]

    def embed_texts_batch(self, texts: list[str]) -> list[list[float]]:
        """Embed multiple texts."""
        if not texts:
            return []
        embeddings = list(self.embedder.embed(texts))
        return [[float(x) for x in emb] for emb in embeddings]

    async def generate_embedding(self, text: str, task_type: str = "RETRIEVAL_QUERY") -> list[float]:
        return self.embed_query(text)

    async def generate_embeddings_batch(self, texts: list[str]) -> list[list[float]]:
        return self.embed_texts_batch(texts)

    def assess_clause(
        self,
        clause: dict,
        evidence_requirements: list[dict],
        audit_questions: list[dict],
        evidence_chunks: list[dict],
    ) -> GeminiAuditResponse:
        """
        Have Gemini assess compliance for a clause given evidence.
        Returns validated Pydantic model.
        """
        evidence_text = ""
        for i, chunk in enumerate(evidence_chunks, 1):
            evidence_text += f"\n--- Evidence {i} (Page {chunk.get('page_number', '?')}, {chunk.get('file_name', 'Doc')}) ---\n"
            evidence_text += chunk.get('text', '') + "\n"

        evidence_req_text = "\n".join([f"- {e.get('name','')}: {e.get('description','')}" for e in evidence_requirements])
        questions_text = "\n".join([f"- {q.get('question','')}" for q in audit_questions])

        prompt = f"""{AUDIT_SYSTEM_PROMPT}

## Clause Being Assessed
Clause ID: {clause.get('id', '')}
Clause Number: {clause.get('number', '')}
Title: {clause.get('title', '')}
Summary: {clause.get('summary', '')}

## Evidence Requirements
{evidence_req_text if evidence_req_text else "No specific evidence requirements defined."}

## Audit Questions
{questions_text if questions_text else "No specific audit questions defined."}

## Retrieved Document Evidence
{evidence_text if evidence_text else "No document evidence was retrieved for this clause."}

## Instructions
Assess whether the retrieved document evidence satisfies this clause requirement.
Return ONLY this exact JSON structure (no markdown, no explanation outside JSON):

{{
  "clause_id": "{clause.get('id', '')}",
  "status": "<compliant|partially_compliant|non_compliant|not_applicable|needs_review>",
  "confidence": <0.0-1.0>,
  "summary": "<1-2 sentence summary>",
  "reasoning": "<detailed reasoning referencing specific evidence>",
  "evidence": [
    {{
      "document_id": "<id>",
      "page": <number>,
      "section": "<section title>",
      "quote_reference": "<brief quote or reference>"
    }}
  ],
  "missing_evidence": ["<list of missing evidence items>"],
  "recommendations": ["<list of recommendations>"],
  "requires_human_review": <true|false>
}}
"""

        response = self.model.generate_content(prompt)
        raw = response.text.strip()

        # Extract JSON if wrapped in markdown
        json_match = re.search(r'\{.*\}', raw, re.DOTALL)
        if json_match:
            raw = json_match.group()

        try:
            data = json.loads(raw)
            return GeminiAuditResponse(**data)
        except Exception as e:
            logger.error(f"Failed to parse Gemini response: {e}")
            response2 = self.model.generate_content(
                prompt + "\n\nIMPORTANT: Return ONLY valid JSON, nothing else."
            )
            raw2 = response2.text.strip()
            json_match2 = re.search(r'\{.*\}', raw2, re.DOTALL)
            if json_match2:
                raw2 = json_match2.group()
            data2 = json.loads(raw2)
            return GeminiAuditResponse(**data2)

    async def assess_clause_conformance(self, req: AuditAssessmentRequest) -> AssessmentResponse:
        evidence_str = "\n".join(req.evidence_chunks[:5])
        prompt = f"""{AUDIT_SYSTEM_PROMPT}

Clause: {req.clause_ref} - {req.clause_title}
Text: {req.clause_text}
Evidence:
{evidence_str}

Evaluate compliance. Return valid JSON only:
{{
  "conformance": "conforming" | "partial" | "nonconformant",
  "confidence": 0.85,
  "findings": ["finding text"],
  "recommendations": ["recommendation text"],
  "severity": "minor" | "major"
}}
"""
        response = self.model.generate_content(prompt)
        raw = response.text.strip()
        json_match = re.search(r'\{.*\}', raw, re.DOTALL)
        if json_match:
            raw = json_match.group()
        try:
            data = json.loads(raw)
            detail = AssessmentDetail(**data)
        except Exception:
            detail = AssessmentDetail(conformance="partial", confidence=0.8, findings=["Assessment review needed"], recommendations=["Review documentation"])
        return AssessmentResponse(assessment=detail)

    def draft_report(self, audit_data: dict, findings: list[dict]) -> str:
        """Have Gemini draft the executive summary and observations section."""
        findings_summary = ""
        for f in findings[:20]:
            findings_summary += f"- Clause {f.get('clause_id','')}: {f.get('status','')} - {f.get('summary','')}\n"

        prompt = f"""You are a professional ISO auditor writing an audit assessment report.

Organization: {audit_data.get('organization_name', 'Organization')}
Standard: {audit_data.get('standard_code', '')} {audit_data.get('standard_version', '')}
Audit Name: {audit_data.get('name', '')}
Overall Score: {audit_data.get('overall_score', 'N/A')}%

Findings Summary:
{findings_summary}

Write:
1. An executive summary (3-4 paragraphs)
2. Key observations (bullet points)
3. Major non-conformities (if any)
4. Recommended corrective actions

Be professional, factual, and ISO audit compliant. Do NOT certify the organization."""

        response = self.model.generate_content(prompt)
        return response.text

    def health_check(self) -> bool:
        return bool(self.model is not None and settings.gemini_api_key)


gemini_service = GeminiService()
