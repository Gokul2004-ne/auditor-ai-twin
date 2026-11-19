import urllib.request
import json
import sys

import os
PROJECT_REF = os.environ.get("SUPABASE_PROJECT_REF", "dkpcclyyuqzseqqmfqvh")
ACCESS_TOKEN = os.environ.get("SUPABASE_ACCESS_TOKEN", "")

def execute_sql(sql_query: str):
    url = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"
    data = json.dumps({"query": sql_query}).encode("utf-8")
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {ACCESS_TOKEN}",
            "Content-Type": "application/json"
        },
        data=data
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def create_bucket(bucket_id: str, public: bool = False):
    url = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/storage/buckets"
    data = json.dumps({"id": bucket_id, "name": bucket_id, "public": public}).encode("utf-8")
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {ACCESS_TOKEN}",
            "Content-Type": "application/json"
        },
        data=data
    )
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"Bucket {bucket_id} created:", resp.status)
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        if "already exists" in body or e.code == 409:
            print(f"Bucket {bucket_id} already exists.")
        else:
            print(f"Bucket error {bucket_id}:", e.code, body)

MIGRATION_SQL = """
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization members
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'auditor', 'reviewer', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Audits
CREATE TABLE IF NOT EXISTS audits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  standard_code TEXT NOT NULL,
  standard_version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','processing','under_review','approved','signed','archived')),
  overall_score NUMERIC(5,2),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending','processing','completed','failed')),
  page_count INTEGER,
  file_hash TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit clauses
CREATE TABLE IF NOT EXISTS audit_clauses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  standard_code TEXT NOT NULL,
  standard_version TEXT NOT NULL,
  clause_id TEXT NOT NULL,
  neo4j_node_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit findings
CREATE TABLE IF NOT EXISTS audit_findings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  audit_clause_id UUID REFERENCES audit_clauses(id),
  status TEXT NOT NULL DEFAULT 'needs_review' CHECK (status IN ('compliant','partially_compliant','non_compliant','not_applicable','needs_review')),
  ai_status TEXT,
  auditor_status TEXT,
  confidence NUMERIC(5,4),
  summary TEXT,
  reasoning TEXT,
  missing_evidence TEXT,
  recommendation TEXT,
  ai_generated BOOLEAN DEFAULT TRUE,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit evidence
CREATE TABLE IF NOT EXISTS audit_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  audit_id UUID NOT NULL REFERENCES audits(id),
  finding_id UUID REFERENCES audit_findings(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id),
  page_number INTEGER,
  section_title TEXT,
  text_excerpt TEXT,
  qdrant_point_id TEXT,
  similarity_score NUMERIC(5,4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','finalized','signed')),
  current_version INTEGER NOT NULL DEFAULT 1,
  finalized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Report versions
CREATE TABLE IF NOT EXISTS report_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content JSONB NOT NULL,
  pdf_path TEXT,
  pdf_hash TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Digital signatures
CREATE TABLE IF NOT EXISTS digital_signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  report_id UUID NOT NULL REFERENCES reports(id),
  report_version INTEGER NOT NULL,
  signer_user_id UUID REFERENCES profiles(id),
  signer_name TEXT NOT NULL,
  signer_role TEXT NOT NULL,
  signature_type TEXT NOT NULL CHECK (signature_type IN ('drawn','uploaded','certificate')),
  signature_storage_path TEXT,
  report_sha256 TEXT NOT NULL,
  signed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  audit_id UUID REFERENCES audits(id),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  before_data JSONB,
  after_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
"""

if __name__ == "__main__":
    print("Running migration on Supabase...")
    try:
        res = execute_sql(MIGRATION_SQL)
        print("Schema migration successful:", res)
    except Exception as e:
        print("Migration error:", e)
        sys.exit(1)

    print("\nEnsuring storage buckets...")
    create_bucket("audit-documents", public=False)
    create_bucket("audit-reports", public=False)
    create_bucket("signatures", public=False)
    print("\nSupabase setup complete!")
