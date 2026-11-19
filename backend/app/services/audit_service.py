from __future__ import annotations

import logging
from typing import Any, Optional
import uuid

from app.services.supabase_service import supabase_service
from app.services.neo4j_service import neo4j_service
from app.services.gemini_service import gemini_service
from app.services.document_service import document_service
from app.schemas.audit import AuditCreate, AuditUpdate
from app.schemas.finding import FindingCreate, FindingUpdate
from app.schemas.gemini import AuditAssessmentRequest

logger = logging.getLogger("audit_twin.audit")


class AuditService:
    async def create_audit(self, data: AuditCreate, user_id: str, organization_id: Optional[str] = None) -> dict[str, Any]:
        audit_dict = data.model_dump()
        audit_dict["created_by"] = user_id
        if organization_id:
            audit_dict["organization_id"] = organization_id
        elif not audit_dict.get("organization_id"):
            # Fallback to default organization
            orgs = await supabase_service.get_user_organizations(user_id)
            if orgs:
                audit_dict["organization_id"] = orgs[0]["organization_id"]
            else:
                default_org = supabase_service.client.table("organizations").select("id").limit(1).execute()
                if default_org.data:
                    audit_dict["organization_id"] = default_org.data[0]["id"]
        audit_dict["status"] = "draft"
        return await supabase_service.create_audit(audit_dict)

    async def get_audit(self, audit_id: str) -> Optional[dict[str, Any]]:
        audit = await supabase_service.get_audit(audit_id)
        if not audit:
            return None

        # Enrich with Neo4j standard name
        if audit.get("standard_id"):
            standard = await neo4j_service.get_standard(audit["standard_id"])
            if standard:
                audit["standard_name"] = standard.get("name")

        # Count findings and documents
        findings = await supabase_service.list_findings(audit_id)
        documents = await supabase_service.list_documents(audit_id)
        audit["finding_count"] = len(findings)
        audit["document_count"] = len(documents)

        return audit

    async def list_audits(self, organization_id: str, status: Optional[str] = None) -> list[dict[str, Any]]:
        return await supabase_service.list_audits(organization_id, status)

    async def update_audit(self, audit_id: str, data: AuditUpdate) -> dict[str, Any]:
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        return await supabase_service.update_audit(audit_id, update_dict)

    async def delete_audit(self, audit_id: str) -> bool:
        return await supabase_service.delete_audit(audit_id)

    # -------------------------------------------------------------------------
    # Findings
    # -------------------------------------------------------------------------
    async def create_finding(self, data: FindingCreate, user_id: str) -> dict[str, Any]:
        finding_dict = data.model_dump()
        finding_dict["created_by"] = user_id
        finding_dict["status"] = "open"
        return await supabase_service.create_finding(finding_dict)

    async def get_finding(self, finding_id: str) -> Optional[dict[str, Any]]:
        finding = await supabase_service.get_finding(finding_id)
        if not finding:
            return None

        # Enrich with clause title from Neo4j
        if finding.get("clause_id"):
            clause = await neo4j_service.get_clause(finding["clause_id"])
            if clause:
                finding["clause_title"] = clause.get("title")

        return finding

    async def update_finding(self, finding_id: str, data: FindingUpdate) -> dict[str, Any]:
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        return await supabase_service.update_finding(finding_id, update_dict)

    async def delete_finding(self, finding_id: str) -> bool:
        return await supabase_service.delete_finding(finding_id)

    # -------------------------------------------------------------------------
    # AI-Assisted Assessment
    # -------------------------------------------------------------------------
    async def assess_clause_against_documents(
        self,
        clause_id: str,
        audit_id: str,
        organization_id: str,
        organization_context: Optional[str] = None,
    ) -> dict[str, Any]:
        """Retrieve relevant evidence from documents and assess clause conformance using Gemini."""
        # Get clause details
        clause = await neo4j_service.get_clause(clause_id)
        if not clause:
            raise ValueError(f"Clause {clause_id} not found")

        clause_text = clause.get("text", clause.get("title", ""))
        query = f"{clause.get('ref', '')} {clause.get('title', '')} {clause_text}"

        # Search for relevant document chunks
        evidence_hits = await document_service.search_document_context(
            query=query,
            organization_id=organization_id,
            audit_id=audit_id,
            limit=8,
        )
        evidence_chunks = [hit["text"] for hit in evidence_hits]

        # Call Gemini for assessment
        assessment_request = AuditAssessmentRequest(
            clause_ref=clause.get("ref", clause_id),
            clause_title=clause.get("title", ""),
            clause_text=clause_text,
            evidence_chunks=evidence_chunks,
            organization_context=organization_context,
        )
        response = await gemini_service.assess_clause_conformance(assessment_request)

        return {
            "clause": clause,
            "evidence_count": len(evidence_chunks),
            "assessment": response.assessment.model_dump(),
            "model_used": response.model_used,
            "prompt_tokens": response.prompt_tokens,
            "completion_tokens": response.completion_tokens,
        }

    async def bulk_assess_standard(
        self,
        audit_id: str,
        standard_id: str,
        organization_id: str,
        organization_context: Optional[str] = None,
        auto_create_findings: bool = True,
    ) -> list[dict[str, Any]]:
        """Run AI assessment across all clauses of a standard."""
        clauses = await neo4j_service.get_clauses_for_standard(standard_id)
        results = []

        for clause in clauses:
            if not clause.get("text"):
                continue  # Skip structural nodes without content
            try:
                result = await self.assess_clause_against_documents(
                    clause_id=clause["id"],
                    audit_id=audit_id,
                    organization_id=organization_id,
                    organization_context=organization_context,
                )
                assessment = result["assessment"]

                # Auto-create findings for non-conformant clauses
                if auto_create_findings and assessment["conformance"] in ("partial", "nonconformant"):
                    for finding_desc in assessment.get("findings", []):
                        await supabase_service.create_finding({
                            "audit_id": audit_id,
                            "clause_id": clause["id"],
                            "clause_ref": clause.get("ref", ""),
                            "title": f"[AI] {clause.get('title', 'Finding')} - {assessment['conformance']}",
                            "description": finding_desc,
                            "severity": assessment.get("severity") or "minor",
                            "recommendation": "; ".join(assessment.get("recommendations", [])),
                            "status": "open",
                            "created_by": "ai-assistant",
                        })

                results.append(result)
            except Exception as e:
                logger.error(f"Assessment failed for clause {clause.get('ref')}: {e}")
                results.append({"clause": clause, "error": str(e)})

        return results

    async def run_audit(self, audit_id: str, organization_id: str) -> dict[str, Any]:
        """Execute audit against selected clauses or standard clauses."""
        clauses = await supabase_service.get_audit_clauses(audit_id)
        results = []
        if clauses:
            for cl in clauses:
                try:
                    res = await self.assess_clause_against_documents(
                        clause_id=cl["clause_id"],
                        audit_id=audit_id,
                        organization_id=organization_id,
                    )
                    assessment = res.get("assessment", {})
                    # Record finding in supabase
                    status_map = {
                        "compliant": "compliant",
                        "partial": "partially_compliant",
                        "nonconformant": "non_compliant"
                    }
                    st = status_map.get(assessment.get("conformance"), "needs_review")
                    f_res = await supabase_service.create_finding({
                        "organization_id": organization_id,
                        "audit_id": audit_id,
                        "audit_clause_id": cl.get("id"),
                        "status": st,
                        "ai_status": st,
                        "auditor_status": st,
                        "confidence": assessment.get("confidence", 0.9),
                        "summary": f"Assessment for {cl.get('clause_id')}",
                        "reasoning": "; ".join(assessment.get("findings", ["Complies with requirements"])),
                        "missing_evidence": "; ".join(assessment.get("gaps", [])) if isinstance(assessment.get("gaps"), list) else str(assessment.get("gaps", "")),
                        "recommendation": "; ".join(assessment.get("recommendations", [])) if isinstance(assessment.get("recommendations"), list) else str(assessment.get("recommendations", "")),
                        "ai_generated": True,
                    })
                    results.append(res)
                except Exception as e:
                    logger.error(f"Error assessing clause {cl}: {e}")
        else:
            audit = await supabase_service.get_audit(audit_id)
            std_id = audit.get("standard_code", "ISO17025:2017")
            results = await self.bulk_assess_standard(
                audit_id=audit_id,
                standard_id=std_id,
                organization_id=organization_id,
                auto_create_findings=True,
            )

        score = await supabase_service.calculate_audit_score(audit_id)
        await supabase_service.update_audit(audit_id, {
            "status": "under_review",
            "overall_score": score
        })
        findings = await supabase_service.list_findings(audit_id)
        return {
            "status": "completed",
            "overall_score": score,
            "evaluated_clauses": len(results),
            "findings": findings,
            "results": results,
        }


audit_service = AuditService()
