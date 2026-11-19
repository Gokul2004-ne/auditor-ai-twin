#!/usr/bin/env python3
"""
Import ISO standards structure into Neo4j knowledge graph.
All operations use MERGE for idempotency and safe repeated runs.
"""
import os
import sys
from pathlib import Path
from neo4j import GraphDatabase

# Load backend .env
env_file = Path(__file__).parent.parent / "backend" / ".env"
if env_file.exists():
    for line in env_file.read_text().splitlines():
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            key, _, value = line.partition('=')
            os.environ[key.strip()] = value.strip()

NEO4J_URI = os.environ.get("NEO4J_URI", "neo4j+ssc://30b20a56.databases.neo4j.io")
NEO4J_USER = os.environ.get("NEO4J_USERNAME", "30b20a56")
NEO4J_PASS = os.environ.get("NEO4J_PASSWORD", "rolfl1SO20gQb73AioVofcxQrq5ypha6SWTbjKJ080g")
NEO4J_DB = os.environ.get("NEO4J_DATABASE", "30b20a56")

ISO_17025_DATA = {
    "standard": {
        "id": "ISO17025:2017",
        "code": "ISO/IEC 17025",
        "version": "2017",
        "title": "General requirements for the competence of testing and calibration laboratories",
        "status": "current"
    },
    "clauses": [
        # Clause 4
        {"id": "ISO17025:2017:4", "number": "4", "title": "General requirements", "summary": "Requirements regarding impartiality and confidentiality in laboratory activities.", "parent": None},
        {"id": "ISO17025:2017:4.1", "number": "4.1", "title": "Impartiality", "summary": "Laboratory activities shall be undertaken impartially and structured and managed so as to safeguard impartiality. The laboratory must identify and eliminate or minimize risks to impartiality on an on-going basis.", "parent": "ISO17025:2017:4",
         "evidence": [
             {"id": "EV:4.1:1", "name": "Impartiality Policy", "description": "Top management commitment and documented policy to preserve impartiality."},
             {"id": "EV:4.1:2", "name": "Impartiality Risk Assessment", "description": "Ongoing risk assessment matrix identifying commercial, financial, and organizational pressures."},
             {"id": "EV:4.1:3", "name": "Personnel Conflict of Interest Declarations", "description": "Signed declarations of confidentiality and freedom from commercial conflicts by all laboratory personnel."}
         ],
         "questions": [
             {"id": "AQ:4.1:1", "question": "Does top management have a formal, documented commitment to impartiality?"},
             {"id": "AQ:4.1:2", "question": "Is there an ongoing risk identification process covering relationships, ownership, and personnel inducements?"},
             {"id": "AQ:4.1:3", "question": "When an impartiality risk is identified, does the lab demonstrate how it eliminates or minimizes the risk?"}
         ]},
        {"id": "ISO17025:2017:4.2", "number": "4.2", "title": "Confidentiality", "summary": "The laboratory shall be responsible, through legally enforceable commitments, for the management of all information obtained or created during laboratory activities.", "parent": "ISO17025:2017:4",
         "evidence": [
             {"id": "EV:4.2:1", "name": "Non-Disclosure Agreements", "description": "Legally enforceable non-disclosure agreements with customers and staff."},
             {"id": "EV:4.2:2", "name": "Customer Notification Procedure", "description": "Procedure for notifying customers in advance of releasing proprietary information required by law."}
         ],
         "questions": [
             {"id": "AQ:4.2:1", "question": "Are all personnel bound by legally enforceable confidentiality commitments?"},
             {"id": "AQ:4.2:2", "question": "Does the laboratory notify the customer prior to releasing confidential information required by law?"}
         ]},

        # Clause 5
        {"id": "ISO17025:2017:5", "number": "5", "title": "Structural requirements", "summary": "Legal entity status, organization structure, management responsibility, and scope of laboratory activities.", "parent": None},
        {"id": "ISO17025:2017:5.1", "number": "5.1", "title": "Legal entity", "summary": "The laboratory shall be a legal entity, or a defined part of a legal entity, legally responsible for its activities.", "parent": "ISO17025:2017:5"},
        {"id": "ISO17025:2017:5.2", "number": "5.2", "title": "Laboratory management responsibility", "summary": "The laboratory shall identify management that has overall responsibility for the laboratory.", "parent": "ISO17025:2017:5"},
        {"id": "ISO17025:2017:5.3", "number": "5.3", "title": "Defined scope of activities", "summary": "The laboratory shall define and document the range of laboratory activities for which it conforms with this standard.", "parent": "ISO17025:2017:5"},
        {"id": "ISO17025:2017:5.4", "number": "5.4", "title": "Performance of laboratory activities", "summary": "Activities shall meet the requirements of the standard, customers, regulatory authorities and accreditation bodies.", "parent": "ISO17025:2017:5"},
        {"id": "ISO17025:2017:5.5", "number": "5.5", "title": "Organization and management structure", "summary": "Define organizational structure, specify responsibility/authority of all personnel, and document operating procedures.", "parent": "ISO17025:2017:5"},
        {"id": "ISO17025:2017:5.6", "number": "5.6", "title": "Personnel authority and resources", "summary": "Personnel must have authority and resources to implement, maintain, and improve the management system.", "parent": "ISO17025:2017:5"},
        {"id": "ISO17025:2017:5.7", "number": "5.7", "title": "Management communication and integrity", "summary": "Ensure communication regarding management system effectiveness and customer requirements.", "parent": "ISO17025:2017:5"},

        # Clause 6
        {"id": "ISO17025:2017:6", "number": "6", "title": "Resource requirements", "summary": "Requirements for personnel, facilities, environmental conditions, equipment, metrological traceability, and external services.", "parent": None},
        {"id": "ISO17025:2017:6.1", "number": "6.1", "title": "General resources", "summary": "Have available the personnel, facilities, equipment, systems and support services necessary.", "parent": "ISO17025:2017:6"},
        {"id": "ISO17025:2017:6.2", "number": "6.2", "title": "Personnel competence and authorization", "summary": "Personnel shall act impartially, be competent, and work in accordance with the management system. Retain competence and training records.", "parent": "ISO17025:2017:6",
         "evidence": [
             {"id": "EV:6.2:1", "name": "Competence Matrix & Job Descriptions", "description": "Documented competence requirements for each function influencing test/calibration results."},
             {"id": "EV:6.2:2", "name": "Training & Authorization Records", "description": "Records of education, qualification, training, supervision, and formal authorization for test methods."}
         ],
         "questions": [
             {"id": "AQ:6.2:1", "question": "Are competence requirements documented for each function?"},
             {"id": "AQ:6.2:2", "question": "Does the lab maintain records of personnel selection, training, supervision, and authorization?"}
         ]},
        {"id": "ISO17025:2017:6.3", "number": "6.3", "title": "Facilities and environmental conditions", "summary": "Environmental conditions shall be suitable for activities and monitored, controlled, and recorded.", "parent": "ISO17025:2017:6"},
        {"id": "ISO17025:2017:6.4", "number": "6.4", "title": "Equipment calibration and maintenance", "summary": "Laboratory shall have access to required equipment; equipment shall be calibrated when accuracy affects results.", "parent": "ISO17025:2017:6"},
        {"id": "ISO17025:2017:6.5", "number": "6.5", "title": "Metrological traceability", "summary": "Establish and maintain metrological traceability through an unbroken chain of calibrations linking to SI units.", "parent": "ISO17025:2017:6"},
        {"id": "ISO17025:2017:6.6", "number": "6.6", "title": "Externally provided products and services", "summary": "Ensure only suitable externally provided products and services are used, with approved supplier criteria.", "parent": "ISO17025:2017:6"},

        # Clause 7
        {"id": "ISO17025:2017:7", "number": "7", "title": "Process requirements", "summary": "Requirements for contract review, method validation, sampling, testing, records, uncertainty, reporting, and complaints.", "parent": None},
        {"id": "ISO17025:2017:7.1", "number": "7.1", "title": "Review of requests, tenders and contracts", "summary": "Procedure for reviewing requests, tenders and contracts ensuring capability and resources.", "parent": "ISO17025:2017:7"},
        {"id": "ISO17025:2017:7.2", "number": "7.2", "title": "Selection, verification and validation of methods", "summary": "Use appropriate validated methods; verify method performance prior to introduction; document validation.", "parent": "ISO17025:2017:7",
         "evidence": [
             {"id": "EV:7.2:1", "name": "Method Validation Dossier", "description": "Documented validation reports specifying performance characteristics, LOD, LOQ, repeatability, and uncertainty."},
             {"id": "EV:7.2:2", "name": "Standard Operating Procedures (SOPs)", "description": "Current approved SOPs for test and calibration methods readily accessible to operators."}
         ],
         "questions": [
             {"id": "AQ:7.2:1", "question": "Has the laboratory verified that it can achieve required method performance before introduction?"},
             {"id": "AQ:7.2:2", "question": "Are non-standard and lab-developed methods validated as extensively as necessary?"}
         ]},
        {"id": "ISO17025:2017:7.3", "number": "7.3", "title": "Sampling", "summary": "Documented sampling plan and method based on statistical methods where applicable.", "parent": "ISO17025:2017:7"},
        {"id": "ISO17025:2017:7.4", "number": "7.4", "title": "Handling of test or calibration items", "summary": "Procedure for transport, receipt, handling, protection, storage, and unambiguous identification of items.", "parent": "ISO17025:2017:7"},
        {"id": "ISO17025:2017:7.5", "number": "7.5", "title": "Technical records", "summary": "Technical records contain sufficient information to enable repetition of activities under conditions close to original.", "parent": "ISO17025:2017:7"},
        {"id": "ISO17025:2017:7.6", "number": "7.6", "title": "Evaluation of measurement uncertainty", "summary": "Identify all contributions of significance and evaluate measurement uncertainty.", "parent": "ISO17025:2017:7"},
        {"id": "ISO17025:2017:7.7", "number": "7.7", "title": "Ensuring the validity of results", "summary": "Monitoring validity of results through quality control, reference materials, proficiency testing.", "parent": "ISO17025:2017:7"},
        {"id": "ISO17025:2017:7.8", "number": "7.8", "title": "Reporting of results", "summary": "Results reviewed and authorized prior to release in clear, objective test reports or calibration certificates.", "parent": "ISO17025:2017:7"},
        {"id": "ISO17025:2017:7.9", "number": "7.9", "title": "Complaints", "summary": "Documented process to receive, evaluate and make decisions on complaints.", "parent": "ISO17025:2017:7"},
        {"id": "ISO17025:2017:7.10", "number": "7.10", "title": "Nonconforming work", "summary": "Procedure when any aspect of testing or calibration does not conform to procedures or customer requirements.", "parent": "ISO17025:2017:7"},
        {"id": "ISO17025:2017:7.11", "number": "7.11", "title": "Control of data and information management", "summary": "LIMS and software validated for functionality; protected from unauthorized access, tampering, and loss.", "parent": "ISO17025:2017:7",
         "evidence": [
             {"id": "EV:7.11:1", "name": "Software Validation Records", "description": "Validation protocol, test plans, and sign-offs for LIMS and calculation software."},
             {"id": "EV:7.11:2", "name": "Data Backup & Security Policy", "description": "Documented access control matrix, offsite backups, and integrity verification schedules."}
         ],
         "questions": [
             {"id": "AQ:7.11:1", "question": "Are computerized data systems validated for proper functionality prior to introduction?"},
             {"id": "AQ:7.11:2", "question": "Are systems protected against unauthorized access, tampering, and data loss?"}
         ]},

        # Clause 8
        {"id": "ISO17025:2017:8", "number": "8", "title": "Management system requirements", "summary": "Option A (dedicated management system) or Option B (ISO 9001 alignment). Document control, audits, reviews.", "parent": None},
        {"id": "ISO17025:2017:8.1", "number": "8.1", "title": "Options (A or B)", "summary": "Establish, document, implement and maintain a management system under Option A or Option B.", "parent": "ISO17025:2017:8"},
        {"id": "ISO17025:2017:8.2", "number": "8.2", "title": "Management system documentation", "summary": "Establish policies and objectives acknowledging commitment to competence and impartiality.", "parent": "ISO17025:2017:8"},
        {"id": "ISO17025:2017:8.3", "number": "8.3", "title": "Control of management system documents", "summary": "Control internal and external documents: approval, periodic review, version tracking, availability.", "parent": "ISO17025:2017:8"},
        {"id": "ISO17025:2017:8.4", "number": "8.4", "title": "Control of records", "summary": "Establish and retain legible records demonstrating fulfilment of requirements, with defined retention time.", "parent": "ISO17025:2017:8"},
        {"id": "ISO17025:2017:8.5", "number": "8.5", "title": "Actions to address risks and opportunities", "summary": "Identify risks and opportunities to ensure management system achieves intended results.", "parent": "ISO17025:2017:8"},
        {"id": "ISO17025:2017:8.6", "number": "8.6", "title": "Improvement", "summary": "Identify opportunities for improvement through feedback, audit results, and data analysis.", "parent": "ISO17025:2017:8"},
        {"id": "ISO17025:2017:8.7", "number": "8.7", "title": "Corrective actions", "summary": "React to nonconformities, eliminate root causes, review effectiveness, and retain records.", "parent": "ISO17025:2017:8"},
        {"id": "ISO17025:2017:8.8", "number": "8.8", "title": "Internal audits", "summary": "Conduct internal audits at planned intervals to confirm conformity and effective implementation.", "parent": "ISO17025:2017:8",
         "evidence": [
             {"id": "EV:8.8:1", "name": "Annual Internal Audit Programme", "description": "Documented schedule covering all laboratory activities, methods, and management system clauses."},
             {"id": "EV:8.8:2", "name": "Internal Audit Reports & Corrective Actions", "description": "Completed audit checklists, finding reports, root cause analyses, and closed corrective action verifications."}
         ],
         "questions": [
             {"id": "AQ:8.8:1", "question": "Does the laboratory conduct internal audits at planned intervals covering all requirements?"},
             {"id": "AQ:8.8:2", "question": "Are internal auditors independent of the activities being audited?"},
             {"id": "AQ:8.8:3", "question": "Are non-conformities identified during internal audits addressed with corrective action without undue delay?"}
         ]},
        {"id": "ISO17025:2017:8.9", "number": "8.9", "title": "Management reviews", "summary": "Review management system at planned intervals to ensure continuing suitability and effectiveness.", "parent": "ISO17025:2017:8"}
    ]
}

ISO_12207_DATA = {
    "standard": {
        "id": "ISO12207:2017",
        "code": "ISO/IEC/IEEE 12207",
        "version": "2017",
        "title": "Systems and software engineering — Software life cycle processes",
        "status": "current"
    },
    "clauses": [
        {"id": "ISO12207:2017:6.1", "number": "6.1", "title": "Agreement processes", "summary": "Acquisition and supply processes to establish agreements between parties.", "parent": None},
        {"id": "ISO12207:2017:6.2", "number": "6.2", "title": "Organizational project-enabling processes", "summary": "Life cycle model management, infrastructure management, portfolio management, human resource management, quality management, and knowledge management.", "parent": None},
        {"id": "ISO12207:2017:6.3", "number": "6.3", "title": "Technical management processes", "summary": "Project planning, assessment and control, decision management, risk management, configuration management, information management, measurement, and quality assurance.", "parent": None},
        {"id": "ISO12207:2017:6.3.5", "number": "6.3.5", "title": "Configuration Management process", "summary": "Establish and maintain the integrity of all identified outputs of a project or process and make them available to concerned parties.", "parent": "ISO12207:2017:6.3"},
        {"id": "ISO12207:2017:6.3.6", "number": "6.3.6", "title": "Information Management process", "summary": "Generate, obtain, confirm, transform, retain, retrieve, and dispose of information throughout the life cycle.", "parent": "ISO12207:2017:6.3"},
        {"id": "ISO12207:2017:6.3.8", "number": "6.3.8", "title": "Quality Assurance process", "summary": "Provide independent assurance that products and processes comply with specified requirements and plans.", "parent": "ISO12207:2017:6.3"},
        {"id": "ISO12207:2017:6.4", "number": "6.4", "title": "Technical processes", "summary": "Requirements definition, architecture, design, implementation, integration, verification, validation, transition, operation, maintenance, and disposal.", "parent": None},
        {"id": "ISO12207:2017:6.4.9", "number": "6.4.9", "title": "Verification process", "summary": "Provide objective evidence that a system or system element fulfils its specified requirements and characteristics.", "parent": "ISO12207:2017:6.4"},
        {"id": "ISO12207:2017:6.4.11", "number": "6.4.11", "title": "Validation process", "summary": "Provide objective evidence that the services provided by a system in its operational environment satisfy intended use.", "parent": "ISO12207:2017:6.4"}
    ]
}

ISO_15504_DATA = {
    "standard": {
        "id": "ISO15504:2004",
        "code": "ISO/IEC 15504",
        "version": "2004",
        "title": "Information technology — Process assessment — Part 1: Concepts and vocabulary",
        "status": "historical_reference"
    },
    "clauses": [
        {"id": "ISO15504:2004:4.1", "number": "4.1", "title": "Concepts and General Purpose", "summary": "Concepts of process assessment for process improvement and capability determination.", "parent": None},
        {"id": "ISO15504:2004:4.2", "number": "4.2", "title": "Assessment framework", "summary": "The context of assessment process and assessment indicators (work products, practice, or resource).", "parent": None},
        {"id": "ISO15504:2004:4.3", "number": "4.3", "title": "Competency of assessors", "summary": "Requirements for assessor competence and objective evidence verification.", "parent": None}
    ]
}

# Cross standard mappings: (source_clause_id, target_clause_id, reason)
CROSS_MAPPINGS = [
    ("ISO17025:2017:7.11", "ISO12207:2017:6.3.6", "Information and data management requirements"),
    ("ISO17025:2017:8.3", "ISO12207:2017:6.3.5", "Document and configuration management controls"),
    ("ISO17025:2017:8.8", "ISO12207:2017:6.3.8", "Internal audit and quality assurance evaluation"),
    ("ISO17025:2017:7.2", "ISO12207:2017:6.4.9", "Verification and validation of methods"),
    ("ISO17025:2017:8.5", "ISO12207:2017:6.3.4", "Risk management controls"),
    ("ISO15504:2004:4.2", "ISO17025:2017:8.8", "Process assessment and audit methodology alignment"),
    ("ISO15504:2004:4.3", "ISO17025:2017:6.2", "Assessor and auditor competence criteria")
]

def import_standards(driver):
    with driver.session(database=NEO4J_DB) as session:
        for pkg in [ISO_17025_DATA, ISO_12207_DATA, ISO_15504_DATA]:
            std = pkg["standard"]
            print(f"Importing standard: {std['code']} ({std['version']})...")
            session.run("""
                MERGE (s:Standard {id: $id})
                SET s.code = $code, s.version = $version, s.title = $title, s.status = $status
            """, **std)

            for c in pkg["clauses"]:
                session.run("""
                    MERGE (cl:Clause {id: $id})
                    SET cl.number = $number, cl.title = $title, cl.summary = $summary, cl.standard_id = $standard_id
                """, id=c["id"], number=c["number"], title=c["title"], summary=c["summary"], standard_id=std["id"])

                # Standard -> HAS_CLAUSE
                session.run("""
                    MATCH (s:Standard {id: $standard_id})
                    MATCH (cl:Clause {id: $clause_id})
                    MERGE (s)-[:HAS_CLAUSE]->(cl)
                """, standard_id=std["id"], clause_id=c["id"])

                # Parent-child
                if c.get("parent"):
                    session.run("""
                        MATCH (p:Clause {id: $parent_id})
                        MATCH (ch:Clause {id: $child_id})
                        MERGE (p)-[:PARENT_OF]->(ch)
                        MERGE (ch)-[:CHILD_OF]->(p)
                    """, parent_id=c["parent"], child_id=c["id"])

                # Evidence requirements
                for ev in c.get("evidence", []):
                    session.run("""
                        MATCH (cl:Clause {id: $clause_id})
                        MERGE (e:EvidenceType {id: $ev_id})
                        SET e.name = $name, e.description = $description
                        MERGE (cl)-[:REQUIRES_EVIDENCE]->(e)
                    """, clause_id=c["id"], ev_id=ev["id"], name=ev["name"], description=ev["description"])

                # Audit questions
                for aq in c.get("questions", []):
                    session.run("""
                        MATCH (cl:Clause {id: $clause_id})
                        MERGE (q:AuditQuestion {id: $aq_id})
                        SET q.question = $question
                        MERGE (cl)-[:HAS_AUDIT_QUESTION]->(q)
                    """, clause_id=c["id"], aq_id=aq["id"], question=aq["question"])

        # Import cross mappings
        print("Importing cross-standard mappings...")
        for src, tgt, reason in CROSS_MAPPINGS:
            session.run("""
                MATCH (a:Clause {id: $src})
                MATCH (b:Clause {id: $tgt})
                MERGE (a)-[r:MAPS_TO]->(b)
                SET r.reason = $reason
            """, src=src, tgt=tgt, reason=reason)

        # Count results
        res = session.run("""
            MATCH (s:Standard) WITH count(s) as standards
            MATCH (c:Clause) WITH standards, count(c) as clauses
            MATCH (e:EvidenceType) WITH standards, clauses, count(e) as evidence_types
            MATCH (q:AuditQuestion) WITH standards, clauses, evidence_types, count(q) as questions
            MATCH ()-[r:MAPS_TO]->() WITH standards, clauses, evidence_types, questions, count(r) as mappings
            RETURN standards, clauses, evidence_types, questions, mappings
        """).single()

        print("\n" + "=" * 50)
        print("Knowledge Graph Import Summary:")
        print(f"  Standards:       {res['standards']}")
        print(f"  Clauses:         {res['clauses']}")
        print(f"  Evidence Types:  {res['evidence_types']}")
        print(f"  Audit Questions: {res['questions']}")
        print(f"  Cross Mappings:  {res['mappings']}")
        print("=" * 50)

if __name__ == "__main__":
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASS))
    try:
        import_standards(driver)
    finally:
        driver.close()
