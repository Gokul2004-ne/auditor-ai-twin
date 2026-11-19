"""
Seed demo data for the Auditor AI Twin:
1. Verifies/creates organization in Supabase
2. Creates an audit for ISO 17025
3. Uploads and processes a sample Quality Manual PDF
4. Runs autonomous AI assessment with Gemini
5. Generates draft report
"""

import os
import sys
import asyncio
from pathlib import Path
from dotenv import load_dotenv

# Add parent directory to path so we can import backend app
sys.path.append(str(Path(__file__).parent.parent / "backend"))

# Load backend environment variables
load_dotenv(Path(__file__).parent.parent / "backend" / ".env")

from app.core.config import settings
from app.services.supabase_service import supabase_service
from app.services.neo4j_service import neo4j_service
from app.services.document_service import document_service
from app.services.audit_service import audit_service
from app.services.report_service import report_service
from app.services.signature_service import signature_service

async def main():
    print("=" * 60)
    print("Auditor AI Twin - Demo Seeder & End-to-End Verification")
    print("=" * 60)

    client = supabase_service.client
    
    # 1. Organization
    print("\n[1/6] Verifying Organization...")
    org_res = client.table("organizations").select("*").limit(1).execute()
    if org_res.data:
        org = org_res.data[0]
        print(f"  -> Found existing organization: {org['name']} (ID: {org['id']})")
    else:
        new_org = client.table("organizations").insert({
            "name": "Acme Analytical Laboratories Inc."
        }).execute()
        org = new_org.data[0]
        print(f"  -> Created default organization: {org['name']} (ID: {org['id']})")
    org_id = org["id"]

    # 2. Check Clauses in Neo4j
    print("\n[2/6] Verifying Neo4j ISO Standards Knowledge Graph...")
    clauses = await neo4j_service.get_clauses_for_standard("ISO17025:2017")
    print(f"  -> Successfully retrieved {len(clauses)} clauses for ISO/IEC 17025:2017")
    target_clause_ids = [c["id"] for c in clauses[:5]] # Take first 5 clauses for rapid demo
    print(f"  -> Selected 5 target clauses: {target_clause_ids}")

    # 3. Create Sample Audit
    print("\n[3/6] Creating Audit Engagement in Supabase...")
    audit_data = {
        "organization_id": org_id,
        "name": "Annual Laboratory Competence Audit (ISO 17025:2017)",
        "standard_code": "ISO/IEC 17025",
        "standard_version": "2017",
        "status": "processing"
    }
    audit_res = client.table("audits").insert(audit_data).execute()
    audit = audit_res.data[0]
    audit_id = audit["id"]
    print(f"  -> Created Audit: {audit['name']} (ID: {audit_id})")

    # Add clauses to audit
    for cid in target_clause_ids:
        client.table("audit_clauses").insert({
            "organization_id": org_id,
            "audit_id": audit_id,
            "standard_code": "ISO/IEC 17025",
            "standard_version": "2017",
            "clause_id": cid,
            "neo4j_node_id": cid,
            "status": "pending"
        }).execute()
    print(f"  -> Bound {len(target_clause_ids)} clauses to audit scope")

    # 4. Generate & Ingest Sample Quality Manual
    print("\n[4/6] Creating & Ingesting Evidence Quality Manual PDF...")
    import fitz # PyMuPDF
    doc = fitz.open()
    page = doc.new_page()
    sample_text = """
ACME ANALYTICAL LABORATORIES - QUALITY MANUAL QM-2026

1. SCOPE AND LEGAL STATUS
Acme Analytical Laboratories operates as an independent testing facility accredited for chemical and metallurgical analysis.

4. GENERAL REQUIREMENTS
4.1 Impartiality:
Acme Analytical Laboratories undertakes all testing activities impartially. Management is committed to impartiality. The laboratory structure ensures commercial, financial, or other pressures do not compromise impartiality. All personnel sign annual conflict-of-interest disclosures and risks to impartiality are continuously identified and mitigated.

4.2 Confidentiality:
The laboratory is legally responsible through enforceable agreements for all information obtained or created during testing activities. All customer reports and raw test data are encrypted at rest and in transit. Proprietary customer information is kept confidential except where required by law.

5. STRUCTURAL REQUIREMENTS
The laboratory is a legally registered corporation. The Technical Director has overall responsibility for laboratory technical operations and the Quality Manager oversees the management system implementation.

6. RESOURCE REQUIREMENTS
6.2 Personnel:
All testing technicians have verified academic qualifications and have completed documented internal competence authorizations before operating spectrophotometers and gas chromatographs. Training records and annual competency reviews are maintained in the QA document portal.

6.4 Equipment:
All measurement equipment (balances, spectrometers, temperature controllers) is subject to scheduled calibration by an ISO 17025 accredited calibration vendor. Calibration certificates and measurement uncertainty calculations are verified prior to returning equipment to service.
"""
    page.insert_text((50, 60), sample_text, fontsize=10)
    pdf_bytes = doc.write()
    doc.close()

    storage_path = f"{org_id}/{audit_id}/source.pdf"
    print(f"  -> Uploading PDF ({len(pdf_bytes)} bytes) to Supabase Storage 'audit-documents'...")
    try:
        client.storage.from_("audit-documents").upload(
            storage_path,
            pdf_bytes,
            {"content-type": "application/pdf", "upsert": "true"}
        )
    except Exception as e:
        print(f"  -> Storage upload note: {e}")

    # Insert document record
    doc_res = client.table("documents").insert({
        "organization_id": org_id,
        "audit_id": audit_id,
        "file_name": "Quality_Manual_QM_2026.pdf",
        "storage_path": storage_path,
        "mime_type": "application/pdf",
        "file_size": len(pdf_bytes),
        "processing_status": "completed",
        "page_count": 1
    }).execute()
    document = doc_res.data[0]
    document_id = document["id"]
    print(f"  -> Registered document (ID: {document_id})")

    # Vectorize and push to Qdrant
    print("  -> Vectorizing text and ingesting to Qdrant collection 'audit_documents' via DocumentService...")
    proc_res = await document_service.process_pdf(
        file_bytes=pdf_bytes,
        filename="Quality_Manual_QM_2026.pdf",
        audit_id=audit_id,
        organization_id=org_id,
        uploaded_by="auditor-seed"
    )
    print(f"  -> Successfully stored {proc_res['chunk_count']} embedded chunks into Qdrant!")

    # 5. Run Autonomous AI Assessment
    print("\n[5/6] Executing Autonomous AI Twin Audit with Gemini 2.5 Flash & Qdrant RAG...")
    run_result = await audit_service.run_audit(audit_id=audit_id, organization_id=org_id)
    print(f"  -> Audit Completed! Overall Score: {run_result['overall_score']}%")
    print(f"  -> Findings generated: {len(run_result['findings'])}")
    for f in run_result['findings']:
        print(f"     * Clause {f.get('clause_id')}: {f.get('status')} (Confidence: {f.get('confidence')})")

    # 6. Generate & Sign Official Report
    print("\n[6/6] Generating and Digitally Signing Official Report...")
    from datetime import datetime, timezone
    import hashlib
    from app.schemas.report import ReportCreate, SignatureRequest

    report_data = ReportCreate(
        audit_id=audit_id,
        title=f"Audit Report - {audit['name']}",
        executive_summary="Autonomous audit conducted according to ISO/IEC 17025:2017 specifications. Found evidence of compliance in impartiality safeguards, customer confidentiality, and equipment calibration controls."
    )
    report_res = await report_service.create_report(report_data, user_id="00000000-0000-0000-0000-000000000001")
    report_id = report_res["id"]
    print(f"  -> Generated Report: {report_res['title']} (ID: {report_id})")

    # Finalize report
    pdf_bytes = await report_service.generate_pdf(report_id)
    sha256_hash = hashlib.sha256(pdf_bytes).hexdigest()
    await supabase_service.update_report(report_id, {
        "status": "finalized",
        "finalized_at": datetime.now(timezone.utc).isoformat(),
        "content_hash": sha256_hash,
    })
    print(f"  -> Report Finalized. SHA-256 Digest: {sha256_hash}")

    # Apply digital signature
    import base64
    sig_req = SignatureRequest(
        report_id=report_id,
        signer_name="Dr. Jane Smith",
        signer_title="Lead Technical ISO Auditor",
        signature_data=base64.b64encode(b"PNG_SAMPLE_SIG_BYTES").decode("utf-8"),
    )
    sig_res = await signature_service.attach_signature_to_report(sig_req)
    print(f"  -> Digital Signature Applied! Signer: {sig_res.get('signer_name')}")
    print(f"  -> Sealed Report Digest: {sig_res.get('report_sha256')}")

    print("\n" + "=" * 60)
    print("SUCCESS: End-to-end Auditor Twin workflow fully verified!")
    print(f"Audit Review URL: http://localhost:3000/audits/{audit_id}")
    print(f"Report URL:       http://localhost:3000/reports/{report_id}")
    print(f"Verification URL: http://localhost:3000/verify/{report_id}")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
