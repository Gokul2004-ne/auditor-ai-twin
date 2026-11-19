# Auditor AI Twin — Production ISO Compliance & Intelligent Audit Engine

A full-stack, enterprise-grade **Auditor AI Twin** web application engineered for autonomous, evidence-backed ISO standards auditing (supporting **ISO/IEC 17025:2017**, **ISO/IEC/IEEE 12207:2017**, and **ISO/IEC 15504-1:2004**).

The application is wired end-to-end with **zero mock data, zero dummy APIs, and zero placeholder responses**.

---

## 🌟 The Three Primary Operations

The user experience focuses strictly on three primary compliance workflows:

```text
Audit Twin Navigation
├── [ Standards Graph ]    -> Interactive Neo4j Knowledge Graph with React Flow
├── [ Audit Document ]      -> Evidence upload (PDF), Qdrant Vector RAG & Gemini assessment
└── [ Report & Sign ]       -> ReportLab PDF compilation, SHA-256 seal, and digital signatures
```

1. **Standards Knowledge Graph (`/standards`)**:
   - Visual directed graph powered by **React Flow** and **Neo4j Aura**.
   - Collapsible clause hierarchy tree (e.g. Section 4 General, Section 5 Structural, Section 6 Resource, Section 7 Process, Section 8 Management).
   - Deep inspection of evidence requirements (`REQUIRES_EVIDENCE`), auditor questions (`HAS_AUDIT_QUESTION`), and cross-standard mappings (`MAPS_TO`).
2. **Audit Document (`/audits/new` & `/audits/[auditId]`)**:
   - Multi-step engagement configuration selecting target standards and clauses.
   - Evidence document ingestion via **PyMuPDF**, dense 384-dim ONNX vector embedding, and multi-tenant isolated vector storage in **Qdrant Cloud**.
   - Autonomous assessment by **Gemini 2.5 Flash** generating granular compliance findings, gap analyses, and corrective action recommendations.
   - Human-in-the-loop review dashboard with Accept, Modify, and Reject controls.
3. **Report & Digital Signature (`/reports/[reportId]` & `/verify/[reportId]`)**:
   - Structured audit reports containing Gemini-drafted executive summaries, scope, observations, and non-conformities.
   - Version history and changelog tracking across draft revisions.
   - Immutable report finalization calculating cryptographic **SHA-256** checksums.
   - Digital signature authorization (drawn canvas or high-resolution image upload) stamped into the compiled PDF using PyMuPDF.
   - Public certificate verification page (`/verify/[reportId]`) for third-party cryptographic proof of document integrity.

---

## 🏗️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 15+ (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui, React Flow, TanStack Query, Lucide Icons, Sonner |
| **Orchestration Service** | FastAPI (Python 3.12+ / 3.14), Pydantic v2, PyMuPDF, ReportLab, FastEmbed (ONNX) |
| **Relational Database & Storage** | Supabase PostgreSQL with Row Level Security (RLS), Supabase Storage |
| **Standards Knowledge Graph** | Neo4j Aura Graph Database (`neo4j+ssc://`) |
| **Vector Search & RAG** | Qdrant Cloud (384-dimensional cosine similarity index) |
| **Reasoning Engine** | Google Gemini 2.5 Flash |

---

## 📁 Repository Structure

```text
audit-twin/
├── frontend/                     # Next.js 15 enterprise web application
│   ├── app/
│   │   ├── (auth)/login/         # Supabase Auth login/signup with demo autofill
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/        # Executive audit KPIs & engagement overview
│   │   │   ├── standards/        # Standards Knowledge Graph visualizer (React Flow)
│   │   │   ├── audits/           # Audits table, creation wizard & review screens
│   │   │   ├── reports/          # Report viewer, editor & signing workflow
│   │   │   └── settings/         # Engine diagnostics & sensitivity configurations
│   │   └── verify/[reportId]/    # Public cryptographic certificate validation
│   ├── components/               # React UI primitives, graph & review panels
│   └── lib/                      # Supabase SSR clients and Axios interceptors
├── backend/                      # FastAPI Python orchestration engine
│   ├── app/
│   │   ├── api/routes/           # Standards, Audits, Documents, Findings, Reports
│   │   ├── core/                 # Settings, security hashing, JWT, logging
│   │   ├── schemas/              # Pydantic v2 data contracts
│   │   └── services/             # Supabase, Neo4j, Qdrant, Gemini, PyMuPDF, ReportLab
│   └── .env                      # Real credentials for database & AI engines
├── scripts/                      # Database migrations, ISO graph import, demo seeders
│   ├── import_iso_graph.py       # Neo4j ISO 17025, 12207, 15504 importer
│   ├── run_migration.py          # Supabase 12-table relational schema & RLS
│   ├── verify_connections.py     # Live diagnostic for Supabase, Neo4j, Qdrant, Gemini
│   └── seed_demo.py              # End-to-end pipeline verification & sample lab seed
└── docs/                         # In-depth architectural & deployment documentation
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- Valid credentials for Neo4j Aura, Qdrant Cloud, Gemini, and Supabase (pre-configured in `.env`)

### 2. Backend Orchestration Service
```bash
cd backend
python -m venv venv
venv\Scripts\activate
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
API Documentation will be live at `http://localhost:8000/docs`.

### 3. Frontend Web Application
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```
Open `http://localhost:3000` in your browser.

### 4. Verify End-to-End Pipeline
Run the autonomous demo pipeline to seed sample laboratory manual evidence, vectorize chunks to Qdrant, run Gemini assessment, and seal the report with a digital signature:
```bash
python scripts/seed_demo.py
```

---

## 📄 License
This application is proprietary and configured for certified ISO compliance authorities. Standard text definitions adhere to ISO fair-use guidelines.
