# Architecture Overview — Auditor AI Twin

The **Auditor AI Twin** is designed with a strict Separation of Concerns, ensuring multi-tenant isolation, verifiable audit trails, and zero direct exposure of proprietary AI and graph backends to the browser.

---

## 1. System Architecture Diagram

```mermaid
flowchart TD
    User["Auditor / Reviewer (Browser)"]

    subgraph Frontend["Next.js 15+ Frontend (Port 3000)"]
        Pages["App Router (Dashboard, Standards, Audits, Reports)"]
        ReactFlow["React Flow Graph Canvas"]
        SupabaseAuthClient["Supabase Auth JS Client"]
        ApiClient["Axios Interceptor (Bearer JWT)"]
    end

    subgraph Supabase["Supabase Cloud Infrastructure"]
        SupaAuth["Supabase Auth (JWT Provider)"]
        Postgres["PostgreSQL with Row Level Security (RLS)"]
        Storage["Storage Buckets (audit-documents, audit-reports, signatures)"]
    end

    subgraph Backend["FastAPI Orchestration Service (Port 8000)"]
        Security["JWT Verification & Tenant Extraction"]
        DocService["Document Processing (PyMuPDF & FastEmbed)"]
        AuditService["Audit Scoring & Clause Evaluator"]
        ReportService["ReportLab PDF Compiler & SHA-256 Engine"]
        SigService["PyMuPDF Digital Signature Stamper"]
    end

    subgraph ExternalEngines["Dedicated Database & AI Engines"]
        Neo4j["Neo4j Aura Graph DB (Standards, Clauses, Mappings)"]
        Qdrant["Qdrant Cloud Vector DB (Chunk Embeddings & Cosine Search)"]
        Gemini["Google Gemini 2.5 Flash (Audit Reasoning & Summaries)"]
    end

    User --> Pages
    Pages --> SupabaseAuthClient
    SupabaseAuthClient --> SupaAuth
    Pages --> ApiClient

    ApiClient --> Security
    Security --> Postgres
    Security --> DocService
    Security --> AuditService
    Security --> ReportService
    Security --> SigService

    DocService --> Storage
    DocService --> Qdrant
    AuditService --> Neo4j
    AuditService --> Qdrant
    AuditService --> Gemini
    AuditService --> Postgres
    ReportService --> Storage
    ReportService --> Postgres
    SigService --> Storage
    SigService --> Postgres
```

---

## 2. Core Architectural Principles

1. **Supabase as Single Source of Truth**:
   - Manages users, organizations, memberships, audit metadata, findings, reports, signatures, and immutable audit logs.
   - All tenant access is protected via PostgreSQL Row Level Security (RLS) policies.

2. **Neo4j as Source of Knowledge Truth**:
   - Represents the ISO standard ontology: Standards, Clauses, Requirements, EvidenceTypes, AuditQuestions, and Risks.
   - Manages hierarchical relationships (`PARENT_OF`) and cross-standard equivalences (`MAPS_TO`).

3. **Qdrant for Isolated Semantic RAG**:
   - Dense vector storage (384 dimensions) generated locally using ONNX `BAAI/bge-small-en-v1.5`.
   - Tenant isolation enforced on every query via payload filters (`organization_id`, `audit_id`).

4. **Gemini 2.5 Flash as Cognitive Auditor**:
   - Assesses clause conformance by contrasting Neo4j clause requirement text with retrieved Qdrant document excerpts.
   - Synthesizes findings, gap analyses, and recommendations without hallucination.

5. **Cryptographic Proof & Immutable Signatures**:
   - Report finalization computes a SHA-256 checksum over the compiled PDF bytes.
   - Any modification after signing breaks the SHA-256 verification on `/verify/[reportId]`.
