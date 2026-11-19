export type AuditStatus = 'draft' | 'processing' | 'under_review' | 'approved' | 'signed' | 'archived'
export type FindingStatus = 'compliant' | 'partially_compliant' | 'non_compliant' | 'not_applicable' | 'needs_review'
export type UserRole = 'admin' | 'auditor' | 'reviewer' | 'viewer'

export interface Profile {
  id: string
  auth_user_id: string
  full_name: string
  email: string
  created_at: string
}

export interface Organization {
  id: string
  name: string
  created_at: string
}

export interface Audit {
  id: string
  organization_id: string
  name: string
  standard_code: string
  standard_version: string
  status: AuditStatus
  overall_score?: number
  created_by?: string
  created_at: string
  updated_at: string
  completed_at?: string
}

export interface Document {
  id: string
  audit_id: string
  organization_id?: string
  file_name: string
  storage_path: string
  mime_type?: string
  file_size?: number
  processing_status: 'pending' | 'processing' | 'completed' | 'failed'
  page_count?: number
  file_hash?: string
  created_at?: string
}

export interface AuditClause {
  id: string
  audit_id: string
  standard_code: string
  standard_version: string
  clause_id: string
  neo4j_node_id?: string
  status: string
  created_at?: string
}

export interface Finding {
  id: string
  organization_id?: string
  audit_id: string
  audit_clause_id?: string
  status: FindingStatus
  ai_status?: FindingStatus
  auditor_status?: FindingStatus
  confidence?: number
  summary?: string
  reasoning?: string
  missing_evidence?: string
  recommendation?: string
  ai_generated?: boolean
  reviewed_by?: string
  reviewed_at?: string
  created_at?: string
  updated_at?: string
  audit_clauses?: { clause_id: string; standard_code: string }
  audit_evidence?: Evidence[]
}

export interface Evidence {
  id: string
  document_id: string
  page_number?: number
  section_title?: string
  text_excerpt?: string
  qdrant_point_id?: string
  similarity_score?: number
  created_at?: string
}

export interface Report {
  id: string
  organization_id?: string
  audit_id: string
  title?: string
  status: 'draft' | 'finalized' | 'signed'
  current_version: number
  version?: number
  executive_summary?: string
  methodology?: string
  content?: Record<string, any>
  content_hash?: string
  pdf_url?: string
  is_signed?: boolean
  signed_at?: string
  signer_name?: string
  signer_title?: string
  verification_url?: string
  finalized_at?: string
  created_at: string
  updated_at?: string
}

export interface Standard {
  id: string
  code: string
  version: string
  title?: string
  status: string
}

export interface Clause {
  id: string
  number: string
  title: string
  summary?: string
  standard_id: string
  parent_id?: string
}

export interface ClauseDetail {
  clause: Clause
  parents: Clause[]
  children: Clause[]
  dependencies: Clause[]
  related: Clause[]
  evidence_requirements: Array<{ id: string; name: string; description: string }>
  audit_questions: Array<{ id: string; question: string }>
  cross_standard_mappings: Clause[]
}
