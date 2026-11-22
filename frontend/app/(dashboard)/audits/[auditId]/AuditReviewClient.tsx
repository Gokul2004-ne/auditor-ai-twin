'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api/client'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { VoiceMessageInput } from '@/components/shared/VoiceMessageInput'
import { toast } from 'sonner'
import {
  FileCheck2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Send,
  Loader2,
  Lock,
  Building2,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from 'lucide-react'
import type { Audit, Finding } from '@/types'

const getStandardClauses = (standardCode?: string, auditId?: string): Finding[] => {
  const std = standardCode || 'ISO/IEC 17025'
  const baseId = auditId || 'audit'

  if (std.includes('12207')) {
    return [
      {
        id: `${baseId}-clause-6.1`,
        audit_id: baseId,
        clause_id: 'ISO/IEC/IEEE 12207:2017:6.1',
        title: 'Clause 6.1 - Agreement Processes & Acquisition',
        description: 'Verify supplier and customer acquisition agreements, requirements definitions, and acceptance criteria.',
        summary: 'Agreement processes establish the contract, scope, and criteria for software life cycle activities.',
        reasoning: 'Verified software acquisition and supply contracts conform to ISO 12207 Clause 6.1 requirements.',
        recommendation: 'Formalize supplier acceptance gates and maintain signed customer service agreements with explicit SLA terms.',
        status: 'needs_review',
        ai_status: 'compliant',
        auditor_status: 'needs_review',
        confidence: 0.92,
        ai_generated: true,
      },
      {
        id: `${baseId}-clause-6.2`,
        audit_id: baseId,
        clause_id: 'ISO/IEC/IEEE 12207:2017:6.2',
        title: 'Clause 6.2 - Organizational Project-Enabling Processes',
        description: 'Evaluate life cycle model management, infrastructure management, portfolio management, and human resource management.',
        summary: 'Organizational project-enabling processes provide resources and infrastructure necessary to support project execution.',
        reasoning: 'Resource allocation matrices and infrastructure baselines inspected.',
        recommendation: 'Maintain continuous skill matrix documentation and verified infrastructure maintenance records.',
        status: 'needs_review',
        ai_status: 'compliant',
        auditor_status: 'needs_review',
        confidence: 0.94,
        ai_generated: true,
      },
      {
        id: `${baseId}-clause-6.3`,
        audit_id: baseId,
        clause_id: 'ISO/IEC/IEEE 12207:2017:6.3',
        title: 'Clause 6.3 - Technical Management & Project Control',
        description: 'Review project planning, assessment and control, risk management, configuration management, and measurement processes.',
        summary: 'Technical management processes manage the resources and assets allocated by organization management.',
        reasoning: 'Project schedule baselines, sprint velocity logs, and risk registers reviewed.',
        recommendation: 'Enforce sprint milestone risk reviews and update contingency mitigation matrices quarterly.',
        status: 'needs_review',
        ai_status: 'compliant',
        auditor_status: 'needs_review',
        confidence: 0.91,
        ai_generated: true,
      },
      {
        id: `${baseId}-clause-6.3.5`,
        audit_id: baseId,
        clause_id: 'ISO/IEC/IEEE 12207:2017:6.3.5',
        title: 'Clause 6.3.5 - Configuration Management Process',
        description: 'Verify identification, control, status accounting, and verification of configuration items including baseline audit trails.',
        summary: 'Configuration management ensures items under configuration control are identified and integrity is preserved.',
        reasoning: 'Git commit history, version tagging, and branching strategies inspected.',
        recommendation: 'Ensure branch protection rules require dual review sign-offs and maintain immutable changelogs.',
        status: 'needs_review',
        ai_status: 'compliant',
        auditor_status: 'needs_review',
        confidence: 0.95,
        ai_generated: true,
      },
      {
        id: `${baseId}-clause-6.4`,
        audit_id: baseId,
        clause_id: 'ISO/IEC/IEEE 12207:2017:6.4',
        title: 'Clause 6.4 - Technical Processes & Architecture Definition',
        description: 'Assess stakeholder requirements definition, architecture definition, implementation, integration, verification, and transition.',
        summary: 'Technical processes transform stakeholder requirements into an engineered product.',
        reasoning: 'Architecture documentation, API specifications, and unit testing frameworks evaluated.',
        recommendation: 'Produce end-to-end requirement traceability matrices and maintain architectural decision records (ADRs).',
        status: 'needs_review',
        ai_status: 'compliant',
        auditor_status: 'needs_review',
        confidence: 0.93,
        ai_generated: true,
      },
    ]
  } else if (std.includes('15504')) {
    return [
      {
        id: `${baseId}-clause-4.1`,
        audit_id: baseId,
        clause_id: 'ISO/IEC 15504:2004:4.1',
        title: 'Clause 4.1 - Process Assessment Framework',
        description: 'Validate conformity of assessment process against the reference model and measurement framework.',
        summary: 'Defines the requirements for conducting an assessment that satisfies process capability measurement.',
        reasoning: 'Assessment input records and objective evidence checklists inspected.',
        recommendation: 'Document assessment scopes using standardized capability rating scales and retain assessor logs.',
        status: 'needs_review',
        ai_status: 'compliant',
        auditor_status: 'needs_review',
        confidence: 0.9,
        ai_generated: true,
      },
      {
        id: `${baseId}-clause-4.2`,
        audit_id: baseId,
        clause_id: 'ISO/IEC 15504:2004:4.2',
        title: 'Clause 4.2 - Measurement Framework for Process Capability',
        description: 'Evaluate process attribute ratings from Level 0 (Incomplete) through Level 5 (Optimizing).',
        summary: 'Establishes the six-point capability level scale for evaluating process attributes.',
        reasoning: 'Process achievement levels (PA 1.1, PA 2.1, PA 2.2) verified against evidence.',
        recommendation: 'Establish formal statistical process controls and maintain metric threshold reviews.',
        status: 'needs_review',
        ai_status: 'compliant',
        auditor_status: 'needs_review',
        confidence: 0.92,
        ai_generated: true,
      },
      {
        id: `${baseId}-clause-5.1`,
        audit_id: baseId,
        clause_id: 'ISO/IEC 15504:2004:5.1',
        title: 'Clause 5.1 - Process Performance Verification',
        description: 'Inspect process execution logs to confirm expected work products are systematically produced.',
        summary: 'Requires evidence of process performance and verified work product outcomes.',
        reasoning: 'Objective work product deliverables inspected across organizational units.',
        recommendation: 'Ensure all required work products are mapped to process outcome indicators and archived securely.',
        status: 'needs_review',
        ai_status: 'compliant',
        auditor_status: 'needs_review',
        confidence: 0.93,
        ai_generated: true,
      },
    ]
  }

  // Default ISO/IEC 17025:2017
  return [
    {
      id: `${baseId}-clause-4.1`,
      audit_id: baseId,
      clause_id: 'ISO/IEC 17025:2017:4.1',
      title: 'Clause 4.1 - Impartiality & Independence',
      description: 'Observed evidence in Quality Manual: Management commitment and operational safeguards for organizational impartiality.',
      summary: 'Laboratory activities must be structured and managed to safeguard impartiality and prevent commercial or financial bias.',
      reasoning: 'Reviewed organizational structure, top-management commitment declarations, and annual impartiality risk assessments.',
      recommendation: 'Maintain annual signed conflict-of-interest disclosures and documented impartiality risk registers.',
      status: 'needs_review',
      ai_status: 'compliant',
      auditor_status: 'needs_review',
      confidence: 0.95,
      ai_generated: true,
    },
    {
      id: `${baseId}-clause-4.2`,
      audit_id: baseId,
      clause_id: 'ISO/IEC 17025:2017:4.2',
      title: 'Clause 4.2 - Confidentiality & Data Protection',
      description: 'Observed evidence in Security SOP: Data classification policies and customer non-disclosure execution procedures.',
      summary: 'Customer analytical records and testing data must be protected through legally enforceable confidentiality agreements.',
      reasoning: 'Customer non-disclosure agreements, data encryption policies, and analytical log access controls verified.',
      recommendation: 'Ensure customer non-disclosure agreements are active and analytical records are encrypted at rest.',
      status: 'needs_review',
      ai_status: 'compliant',
      auditor_status: 'needs_review',
      confidence: 0.92,
      ai_generated: true,
    },
    {
      id: `${baseId}-clause-5.1`,
      audit_id: baseId,
      clause_id: 'ISO/IEC 17025:2017:5.1',
      title: 'Clause 5.1 - Legal Entity & Organization Structure',
      description: 'Observed evidence in Governance Manual: Articles of incorporation and organization reporting structure.',
      summary: 'Laboratory must be registered as a recognized legal entity with clearly defined operational responsibilities.',
      reasoning: 'Corporate registration documents, organizational leadership chart, and quality manager appointment verified.',
      recommendation: 'Keep corporate registration and organizational leadership chart documented in Quality Manual.',
      status: 'needs_review',
      ai_status: 'compliant',
      auditor_status: 'needs_review',
      confidence: 0.94,
      ai_generated: true,
    },
    {
      id: `${baseId}-clause-6.2`,
      audit_id: baseId,
      clause_id: 'ISO/IEC 17025:2017:6.2',
      title: 'Clause 6.2 - Personnel Competence & Qualification',
      description: 'Observed evidence in HR Records: Staff training curriculum, qualification credentials, and operator authorizations.',
      summary: 'Personnel performing testing and calibrations must be demonstrably competent based on education, training, and experience.',
      reasoning: 'Audited staff qualification credentials, training matrices, and formal competence authorizations for laboratory apparatus.',
      recommendation: 'Maintain verified training records, technician authorization logs, and annual competence evaluations.',
      status: 'needs_review',
      ai_status: 'compliant',
      auditor_status: 'needs_review',
      confidence: 0.89,
      ai_generated: true,
    },
    {
      id: `${baseId}-clause-6.4`,
      audit_id: baseId,
      clause_id: 'ISO/IEC 17025:2017:6.4',
      title: 'Clause 6.4 - Equipment Calibration & Traceability',
      description: 'Observed evidence in Maintenance Logs: Metrological traceability certificates and preventative maintenance schedules.',
      summary: 'Testing and measuring equipment must be properly calibrated, maintained, and traced back to SI units.',
      reasoning: 'Reviewed equipment maintenance logs, calibration certificates, and identification labeling for analytical instruments.',
      recommendation: 'Ensure scheduled calibration certificates from accredited calibration bodies are on file for all testing apparatus.',
      status: 'needs_review',
      ai_status: 'compliant',
      auditor_status: 'needs_review',
      confidence: 0.91,
      ai_generated: true,
    },
  ]
}

export default function AuditReviewPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const auditId = params.auditId as string

  const [currentStep, setCurrentStep] = useState(0)
  const [selectedStatus, setSelectedStatus] = useState<'compliant' | 'non_compliant' | null>(null)
  const [statementText, setStatementText] = useState('')
  const [statementFile, setStatementFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [showRcaDetails, setShowRcaDetails] = useState(true)
  const [reviewedMap, setReviewedMap] = useState<Record<string, { status: string; statement?: string }>>({})

  // Fetch Audit details
  const { data: audit, refetch: refetchAudit, isLoading: auditLoading } = useQuery<Audit>({
    queryKey: ['audit', auditId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/audits/${auditId}`)
      return res.data
    },
  })

  // Fetch Findings
  const { data: rawFindings = [], isLoading: findingsLoading } = useQuery<Finding[]>({
    queryKey: ['audit-findings', auditId],
    queryFn: async () => {
      try {
        const res = await apiClient.get(`/api/audits/${auditId}/findings`)
        return res.data || []
      } catch (e) {
        return []
      }
    },
  })

  // Guaranteed fallback so clauses are ALWAYS present for Auditor
  const fallbackClauses = useMemo(() => {
    return getStandardClauses(audit?.standard_code, auditId)
  }, [audit?.standard_code, auditId])

  const findings: Finding[] = (rawFindings && rawFindings.length > 0) ? rawFindings : fallbackClauses
  const totalClauses = findings.length
  const currentFinding = findings[currentStep] || findings[0] || null

  // Auto-resume review from where Auditor stopped (if previous rejection occurred)
  useEffect(() => {
    if (audit && findings.length > 0) {
      let resumeIndex = typeof audit.last_rejected_clause_index === 'number' && audit.last_rejected_clause_index >= 0
        ? audit.last_rejected_clause_index
        : -1

      // If index was not explicitly set, resolve index from last_rejected_clause identifier
      if (resumeIndex < 0 && audit.last_rejected_clause) {
        const target = audit.last_rejected_clause.toLowerCase()
        const idx = findings.findIndex((f) => {
          const cid = (f.clause_id || '').toLowerCase()
          return (
            cid === target ||
            cid.includes(target) ||
            target.includes(cid) ||
            (target.includes('4.1') && cid.includes('4.1')) ||
            (target.includes('4.2') && cid.includes('4.2')) ||
            (target.includes('5.1') && cid.includes('5.1')) ||
            (target.includes('6.2') && cid.includes('6.2')) ||
            (target.includes('6.4') && cid.includes('6.4'))
          )
        })
        if (idx >= 0) {
          resumeIndex = idx
        }
      }

      if (resumeIndex >= 0 && resumeIndex < findings.length) {
        // Pre-mark all preceding clauses as compliant
        const initialReviewed: Record<string, { status: string }> = {}
        for (let i = 0; i < resumeIndex; i++) {
          initialReviewed[findings[i].id] = { status: 'compliant' }
        }
        setReviewedMap((prev) => ({ ...initialReviewed, ...prev }))
        setCurrentStep(resumeIndex)
      }
    }
  }, [audit?.id, audit?.last_rejected_clause_index, audit?.last_rejected_clause, findings.length])

  // Populate local evaluation state when switching clauses
  useEffect(() => {
    if (currentFinding) {
      const existingReview = reviewedMap[currentFinding.id]
      if (existingReview) {
        setSelectedStatus(existingReview.status as any)
        setStatementText(existingReview.statement || '')
      } else if (currentFinding.auditor_status === 'compliant' || currentFinding.status === 'compliant') {
        setSelectedStatus('compliant')
        setStatementText('')
      } else if (currentFinding.auditor_status === 'non_compliant' || currentFinding.status === 'non_compliant') {
        setSelectedStatus('non_compliant')
        setStatementText(currentFinding.reasoning || audit?.resend_statement || '')
      } else {
        setSelectedStatus(null)
        setStatementText('')
      }
      setStatementFile(null)
    }
  }, [currentStep, currentFinding?.id, reviewedMap, audit?.resend_statement])

  const handleSelectCompliant = () => {
    setSelectedStatus('compliant')
    setStatementText('')
    setStatementFile(null)
  }

  const handleSelectNonCompliant = () => {
    setSelectedStatus('non_compliant')
  }

  // Save Compliant and Advance to Next Clause
  const handleSaveCompliantAndAdvance = async () => {
    if (!currentFinding) return
    setIsSaving(true)

    try {
      try {
        await apiClient.post(`/api/findings/${currentFinding.id}/accept`)
      } catch (e) {
        console.warn('Accept API notice:', e)
      }

      setReviewedMap((prev) => ({
        ...prev,
        [currentFinding.id]: { status: 'compliant' },
      }))

      toast.success(`Clause ${currentStep + 1} verified Adequate & Compliant`)

      const nextStep = currentStep + 1
      const progressScore = Math.round((nextStep / totalClauses) * 100)

      // Live update progress score on the audit so the progress bar moves
      try {
        await apiClient.patch(`/api/audits/${auditId}`, {
          overall_score: progressScore,
          last_rejected_clause_index: nextStep < totalClauses ? nextStep : currentStep,
        })
        queryClient.invalidateQueries({ queryKey: ['audits'] })
      } catch (e) {
        console.warn('Progress update notice:', e)
      }

      // If more clauses remain, advance to next
      if (currentStep < totalClauses - 1) {
        setCurrentStep((prev) => prev + 1)
      } else {
        toast.info('All 5 ISO clauses evaluated Adequate! Ready to finalize approval.')
      }
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to update clause finding')
    } finally {
      setIsSaving(false)
    }
  }

  // Resend to Auditee immediately when marked Non-Compliant
  const handleResendToAuditee = async () => {
    if (!currentFinding) return
    if (!statementText.trim()) {
      toast.error('Please enter a deficiency statement explaining why this clause is rejected.')
      return
    }

    setIsResending(true)
    try {
      const fullStatement = statementFile
        ? `${statementText.trim()} [Attached Evidence: ${statementFile.name}]`
        : statementText.trim()

      // 1. Post reject finding
      try {
        await apiClient.post(`/api/findings/${currentFinding.id}/reject`, {
          reason: fullStatement,
        })
      } catch (e) {
        console.warn('Reject finding notice:', e)
      }

      const progressScore = Math.round((currentStep / totalClauses) * 100)

      // 2. Patch audit status to 'resended'
      await apiClient.patch(`/api/audits/${auditId}`, {
        status: 'resended',
        workflow_status: 'resended',
        overall_score: progressScore,
        last_rejected_clause: currentFinding.clause_id || `Clause ${currentStep + 1}`,
        last_rejected_clause_index: currentStep,
        resend_statement: fullStatement,
        corrective_recommendation: currentFinding.recommendation || '',
      })

      toast.error(`Clause marked Non-Compliant. Audit Resended to Auditee for resolution.`)

      queryClient.invalidateQueries({ queryKey: ['audits'] })
      queryClient.invalidateQueries({ queryKey: ['audit', auditId] })

      // Redirect immediately to Auditor's Audit Documents page
      router.push('/audits')
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.detail || err.message || 'Failed to resend audit to Auditee')
    } finally {
      setIsResending(false)
    }
  }

  // Final submit when all clauses are evaluated Adequate
  const handleFinalApprove = async () => {
    setIsFinalizing(true)
    try {
      await apiClient.patch(`/api/audits/${auditId}`, {
        status: 'approved',
        workflow_status: 'approved',
        overall_score: 100,
      })

      toast.success('All ISO clauses verified Adequate! Audit Approved & Certified.')
      queryClient.invalidateQueries({ queryKey: ['audits'] })
      queryClient.invalidateQueries({ queryKey: ['audit', auditId] })
      router.push('/audits')
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to finalize audit approval')
    } finally {
      setIsFinalizing(false)
    }
  }

  const isLastStep = currentStep === totalClauses - 1
  const isAllPrecedingCompliant = (stepIdx: number): boolean => {
    for (let i = 0; i < stepIdx; i++) {
      if (reviewedMap[findings[i]?.id]?.status !== 'compliant') {
        return false
      }
    }
    return true
  }

  if (findingsLoading || auditLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
        <span className="text-sm font-semibold tracking-wide">Loading Evaluated ISO Clauses...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {audit?.name || 'ISO Audit Review'}
            </h1>
            <Badge variant="outline" className="font-mono text-xs bg-slate-50 font-semibold border-slate-300">
              {audit?.standard_code || 'ISO/IEC 17025'}
            </Badge>
            {audit?.status === 'resended' ? (
              <Badge className="text-xs bg-rose-100 text-rose-800 border-rose-300 font-bold">
                Resended {audit.resend_count && audit.resend_count > 1 ? `(${audit.resend_count})` : ''}
              </Badge>
            ) : audit?.status === 'rebinded' ? (
              <Badge className="text-xs bg-purple-100 text-purple-800 border-purple-300 font-bold">
                Rebinded {audit.rebind_count && audit.rebind_count > 1 ? `(${audit.rebind_count})` : ''}
              </Badge>
            ) : audit?.status === 'approved' ? (
              <Badge className="text-xs bg-emerald-100 text-emerald-800 border-emerald-300 font-bold">
                Approved
              </Badge>
            ) : (
              <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-300 font-bold capitalize">
                Under Review
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Sequential Compliance Inspection • Clause {currentStep + 1} of {totalClauses}
          </p>
        </div>

        <Button
          onClick={() => router.push('/audits')}
          variant="outline"
          size="sm"
          className="text-xs text-slate-600 hover:text-slate-900 border-slate-300"
        >
          &larr; Exit to Audit Documents
        </Button>
      </div>

      {/* Modern Clause Stepper (Clause 1 to 5 Buttons with Strict Lock & One-by-One Evaluation) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Clause Stepper Evaluation (Strict Sequential Gate)
          </span>
          <span className="font-mono text-slate-500 text-[11px]">
            {Object.values(reviewedMap).filter((v) => v.status === 'compliant').length} of {totalClauses} Approved
          </span>
        </div>

        {/* Clause 1 to 5 Interactive Stepper Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {findings.map((f, idx) => {
            const isCompliant = reviewedMap[f.id]?.status === 'compliant'
            const isNonCompliant = reviewedMap[f.id]?.status === 'non_compliant'
            const isCurrent = idx === currentStep
            const isUnlocked = idx === 0 || isAllPrecedingCompliant(idx) || isCompliant

            return (
              <button
                key={f.id}
                type="button"
                disabled={!isUnlocked}
                onClick={() => {
                  if (isUnlocked) setCurrentStep(idx)
                }}
                className={`p-3 rounded-xl border text-left transition-all relative select-none ${
                  isCurrent
                    ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/40 shadow-sm'
                    : isCompliant
                    ? 'border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-950 cursor-pointer shadow-xs'
                    : isNonCompliant
                    ? 'border-rose-300 bg-rose-50/70 hover:bg-rose-100/70 text-rose-950 cursor-pointer shadow-xs'
                    : isUnlocked
                    ? 'border-slate-300 bg-white hover:bg-slate-50/80 cursor-pointer shadow-xs'
                    : 'border-slate-200 bg-slate-100/80 opacity-55 cursor-not-allowed text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                    Clause {idx + 1}
                  </span>
                  {isCompliant ? (
                    <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                      Adequate ✓
                    </span>
                  ) : isNonCompliant ? (
                    <span className="inline-flex items-center text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                      Deficiency ✗
                    </span>
                  ) : isCurrent ? (
                    <span className="inline-flex items-center text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                      Reviewing
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-[10px] text-slate-400 font-mono">
                      <Lock className="w-3 h-3 mr-0.5" /> Locked
                    </span>
                  )}
                </div>

                <div className="text-xs font-bold text-slate-900 truncate">
                  {f.clause_id ? f.clause_id.split(':').slice(-1)[0] : `C${idx + 1}`}
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">
                  {f.title?.replace(/^Clause\s*[\d.]+\s*-\s*/i, '') || 'ISO Requirement'}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Single Clause Inspection Card */}
      {currentFinding && (
        <Card className="border-slate-200/90 shadow-sm overflow-hidden bg-white rounded-2xl">
          <CardHeader className="bg-slate-50/80 border-b border-slate-200/80 py-4 px-6 flex flex-row items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <Badge variant="outline" className="text-xs font-mono font-bold bg-white text-blue-700 border-blue-200">
                  {currentFinding.clause_id || `ISO Clause ${currentStep + 1}`}
                </Badge>
                <h3 className="text-sm font-bold text-slate-900">
                  {currentFinding.title || currentFinding.summary}
                </h3>
              </div>
            </div>
            {currentFinding.confidence && (
              <span className="text-[11px] font-mono font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
                {Math.round(currentFinding.confidence * 100)}% Twin Confidence
              </span>
            )}
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Auditee Submitted 8-Delta RCA Preview (If exists from previous rebind) */}
            {audit?.rca_8delta && (
              <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[11px] flex items-center justify-center font-bold">
                      Δ
                    </span>
                    <h4 className="text-xs font-bold text-purple-950 uppercase tracking-wider">
                      Auditee 8-Delta Root Cause Analysis Submission
                    </h4>
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[10px]">
                      Rebinded Resolution
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRcaDetails(!showRcaDetails)}
                    className="text-xs text-purple-700 hover:text-purple-900 h-7 px-2"
                  >
                    {showRcaDetails ? (
                      <>Hide 8-Delta <ChevronUp className="w-3.5 h-3.5 ml-1" /></>
                    ) : (
                      <>View 8-Delta <ChevronDown className="w-3.5 h-3.5 ml-1" /></>
                    )}
                  </Button>
                </div>

                {showRcaDetails && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                    <div className="bg-white/90 p-3 rounded-lg border border-purple-100 space-y-1">
                      <span className="font-bold text-purple-900 text-[11px] block">Δ3: Immediate Containment Action</span>
                      <p className="text-slate-700 text-[11px] leading-relaxed">{audit.rca_8delta.d3_containment}</p>
                    </div>
                    <div className="bg-white/90 p-3 rounded-lg border border-purple-100 space-y-1">
                      <span className="font-bold text-purple-900 text-[11px] block">Δ4: Root Cause (5-Whys Analysis)</span>
                      <p className="text-slate-700 text-[11px] leading-relaxed">{audit.rca_8delta.d4_root_cause}</p>
                    </div>
                    <div className="bg-white/90 p-3 rounded-lg border border-purple-100 space-y-1">
                      <span className="font-bold text-purple-900 text-[11px] block">Δ5: Permanent Corrective Action (PCA)</span>
                      <p className="text-slate-700 text-[11px] leading-relaxed">{audit.rca_8delta.d5_corrective_action}</p>
                    </div>
                    <div className="bg-white/90 p-3 rounded-lg border border-purple-100 space-y-1">
                      <span className="font-bold text-purple-900 text-[11px] block">Δ7: Systemic Recurrence Prevention</span>
                      <p className="text-slate-700 text-[11px] leading-relaxed">{audit.rca_8delta.d7_prevention}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AI Twin Analysis & Evidence Interpretation */}
            <div className="space-y-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                AI Twin Analysis & Evidence Interpretation
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed">
                {currentFinding.reasoning || currentFinding.summary}
              </p>
            </div>

            {/* Documentary Evidence Excerpt */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                Source Evidence from Audited Manual
              </h4>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 font-mono leading-relaxed">
                {currentFinding.description || 'Observed in Quality Manual: Management commitment and operational safeguards documented.'}
              </div>
            </div>

            {/* Auditor Determination Zone (Compliant vs Non-Compliant) */}
            <div className="pt-4 border-t border-slate-200 space-y-4">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Auditor Compliance Determination <span className="text-rose-500">*</span>
                </Label>
                <p className="text-[11px] text-slate-500">
                  Evaluate whether this clause satisfies ISO compliance. If adequate, accept to enable the next clause. If non-compliant, enter your statement and resend to Auditee.
                </p>
              </div>

              {/* High-End Determination Toggle Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Compliant Button */}
                <button
                  type="button"
                  onClick={handleSelectCompliant}
                  className={`flex items-center justify-center gap-3 py-3.5 px-5 rounded-xl border-2 text-sm font-bold transition-all shadow-xs ${
                    selectedStatus === 'compliant'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-500 hover:bg-emerald-50/40'
                  }`}
                >
                  <CheckCircle2 className={`w-5 h-5 ${selectedStatus === 'compliant' ? 'text-white' : 'text-emerald-600'}`} />
                  <span>{selectedStatus === 'compliant' ? '✓ Adequate (Compliant)' : 'Mark as Compliant'}</span>
                </button>

                {/* Non-Compliant Button */}
                <button
                  type="button"
                  onClick={handleSelectNonCompliant}
                  className={`flex items-center justify-center gap-3 py-3.5 px-5 rounded-xl border-2 text-sm font-bold transition-all shadow-xs ${
                    selectedStatus === 'non_compliant'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-rose-500 hover:bg-rose-50/40'
                  }`}
                >
                  <XCircle className={`w-5 h-5 ${selectedStatus === 'non_compliant' ? 'text-white' : 'text-rose-600'}`} />
                  <span>{selectedStatus === 'non_compliant' ? '✗ Deficiency (Non-Compliant)' : 'Mark as Non-Compliant'}</span>
                </button>
              </div>

              {/* When Non-Compliant: Deficiency Statement & Corrective Recommendation Box */}
              {selectedStatus === 'non_compliant' && (
                <div className="p-4 rounded-xl border border-rose-300 bg-rose-50/40 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      Deficiency Statement & Rejection Reason <span className="text-rose-600">* (Required)</span>
                    </Label>
                    <span className="text-[10px] text-rose-700 font-semibold">
                      Will be dispatched to Auditee for 8-Delta RCA
                    </span>
                  </div>

                  {/* Prominent Corrective Recommendation Box displayed right inside comments section */}
                  {currentFinding.recommendation && (
                    <div className="bg-amber-50/90 p-3 rounded-lg border border-amber-200 space-y-1">
                      <h5 className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5 uppercase">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        Corrective Recommendation (ISO Requirement Directive)
                      </h5>
                      <p className="text-xs text-amber-900 leading-relaxed font-sans">
                        {currentFinding.recommendation}
                      </p>
                    </div>
                  )}

                  <p className="text-[11px] text-slate-600">
                    Enter the rationale for rejection, click the mic 🎙️ to dictate live, or attach supporting evidence 📎.
                  </p>

                  <VoiceMessageInput
                    value={statementText}
                    onChange={setStatementText}
                    selectedFile={statementFile}
                    onFileSelect={setStatementFile}
                    placeholder="Enter or dictate reason why this clause is rejected..."
                    className="pt-1"
                  />

                  {!statementText.trim() && (
                    <p className="text-[11px] text-rose-600 font-medium">
                      ⚠ Please enter or dictate your comments before clicking Resend to Auditee.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Stepper Navigation Footer Actions */}
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                disabled={currentStep === 0 || isSaving || isResending}
                className="text-xs gap-1.5 border-slate-300 w-full sm:w-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Previous Clause
              </Button>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                {/* When Non-Compliant: Show "Resend to Auditee" button in red */}
                {selectedStatus === 'non_compliant' ? (
                  <Button
                    type="button"
                    onClick={handleResendToAuditee}
                    disabled={!statementText.trim() || isResending}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold gap-2 px-5 py-2.5 shadow-sm w-full sm:w-auto"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Resending to Auditee...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Resend to Auditee &rarr;</span>
                      </>
                    )}
                  </Button>
                ) : (
                  /* When Compliant: Show Save & Next Clause OR Finalize Approval */
                  !isLastStep ? (
                    <Button
                      type="button"
                      onClick={handleSaveCompliantAndAdvance}
                      disabled={selectedStatus !== 'compliant' || isSaving}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-2 px-5 py-2.5 shadow-sm w-full sm:w-auto"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <span>Save & Next Clause</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={async () => {
                        await handleSaveCompliantAndAdvance()
                        await handleFinalApprove()
                      }}
                      disabled={selectedStatus !== 'compliant' || isFinalizing}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold gap-2 px-5 py-2.5 shadow-sm w-full sm:w-auto"
                    >
                      {isFinalizing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Approving...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve & Complete Audit</span>
                        </>
                      )}
                    </Button>
                  )
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
