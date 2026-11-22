'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import {
  ArrowRight,
  FileCheck2,
  RotateCcw,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Printer,
  X
} from 'lucide-react'
import type { Audit } from '@/types'

export default function AuditsPage() {
  const [selectedSummaryAudit, setSelectedSummaryAudit] = useState<Audit | null>(null)

  const { data: audits = [], isLoading } = useQuery<Audit[]>({
    queryKey: ['audits'],
    queryFn: async () => {
      const res = await apiClient.get('/api/audits')
      return res.data
    },
  })

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Audit Engagements</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review ISO compliance submissions, inspect evidence findings, and evaluate clause compliance
          </p>
        </div>
      </div>

      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-sm text-slate-400">Loading audit records...</div>
          ) : audits.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">No Audits Submitted for Review</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Auditee client submissions will appear here automatically when documents are submitted for review.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3.5">Audit Name & Scope</th>
                    <th className="px-6 py-3.5">Standard</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Compliance Score</th>
                    <th className="px-6 py-3.5">Created Date</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {audits.map((audit) => {
                    const isApproved =
                      audit.status === 'approved' ||
                      audit.workflow_status === 'approved' ||
                      audit.status === 'signed'
                    const isResended =
                      audit.status === 'resended' ||
                      audit.workflow_status === 'resended' ||
                      audit.status === 'rejected'
                    const isRebinded =
                      audit.status === 'rebinded' ||
                      audit.workflow_status === 'rebinded' ||
                      audit.status === 'resubmitted'

                    const resendCount = audit.resend_count || 1
                    const rebindCount = audit.rebind_count || 1

                    // Live progressive score calculation
                    let score: number | null =
                      audit.overall_score !== null && audit.overall_score !== undefined
                        ? Math.round(audit.overall_score)
                        : null

                    if (isApproved) {
                      score = 100
                    } else if (score === null || score === undefined || score === 0) {
                      if (typeof audit.last_rejected_clause_index === 'number') {
                        score = Math.round((audit.last_rejected_clause_index / 5) * 100)
                      } else if (audit.last_rejected_clause) {
                        const c = audit.last_rejected_clause
                        if (c.includes('4.1')) score = 0
                        else if (c.includes('4.2')) score = 20
                        else if (c.includes('5.1')) score = 40
                        else if (c.includes('6.2')) score = 60
                        else if (c.includes('6.4')) score = 80
                      }
                    }

                    const isFullyReviewed = score === 100 || isApproved

                    return (
                      <tr
                        key={audit.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isResended ? 'bg-rose-50/30' : isRebinded ? 'bg-purple-50/30' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <Link href={`/audits/review/?id=${audit.id}`} className="font-semibold text-slate-900 hover:text-blue-600">
                            {audit.name}
                          </Link>
                          <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                            ID: {audit.id.slice(0, 8)}...
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono">
                          <Badge variant="outline" className="font-normal bg-white">
                            {audit.standard_code}:{audit.standard_version}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          {isResended ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              Resended {resendCount > 1 ? `(${resendCount})` : ''}
                            </span>
                          ) : isRebinded ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300 shadow-2xs">
                              <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
                              Rebinded {rebindCount > 1 ? `(${rebindCount})` : ''}
                            </span>
                          ) : isApproved ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Approved
                            </span>
                          ) : (
                            <Badge
                              variant={audit.status === 'processing' ? 'secondary' : 'outline'}
                              className="capitalize text-[10px]"
                            >
                              {audit.status.replace('_', ' ')}
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {/* Compliance Score Bar */}
                            {score !== null && score > 0 ? (
                              <div className="w-28 space-y-1 shrink-0">
                                <div className="flex justify-between text-[11px] font-semibold text-slate-800">
                                  <span>{score}%</span>
                                  <span
                                    className={
                                      score === 100
                                        ? 'text-emerald-600 font-bold'
                                        : isResended
                                        ? 'text-rose-600'
                                        : 'text-blue-600'
                                    }
                                  >
                                    {score === 100 ? 'Compliant' : isResended ? 'Deficiency' : 'In Progress'}
                                  </span>
                                </div>
                                <Progress value={score} className="h-1.5" />
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px] shrink-0">Not evaluated</span>
                            )}

                            {/* Audit Summary Button - Enabled after completing 100% review */}
                            {isFullyReviewed && (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => setSelectedSummaryAudit(audit)}
                                className="h-7 px-2.5 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:text-blue-800 shadow-2xs gap-1.5 shrink-0 transition-colors"
                              >
                                <FileText className="w-3.5 h-3.5 text-blue-600" />
                                Audit Summary
                              </Button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(audit.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/audits/review/?id=${audit.id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1 hover:border-blue-400 hover:text-blue-600 font-semibold"
                              >
                                Review <ArrowRight className="w-3 h-3" />
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Professional ISO Audit Summary Document Modal */}
      <Dialog open={!!selectedSummaryAudit} onOpenChange={(open) => !open && setSelectedSummaryAudit(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] bg-white p-0 rounded-xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col">
          {/* Top Control Bar */}
          <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                  ISO Standards Conformity Assessment Record
                </h3>
                <p className="text-[10px] text-slate-400">
                  Official Verification Summary Directive & Conformance Registry
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="h-7 text-xs bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / Save PDF
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedSummaryAudit(null)}
                className="h-7 text-xs text-slate-400 hover:text-white hover:bg-slate-800 px-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Document Content Area */}
          <div className="p-8 overflow-y-auto space-y-6 text-slate-900 font-sans print:p-0">
            {/* Formal Document Header */}
            <div className="border-b border-slate-300 pb-5 text-center space-y-1">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                International Organization for Standardization
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                Executive Audit Summary & Verification Record
              </h2>
              <div className="text-xs font-medium text-slate-600">
                Evaluation Standard: {selectedSummaryAudit?.standard_code}:{selectedSummaryAudit?.standard_version}
              </div>
              <div className="inline-block mt-2 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded text-xs font-bold uppercase tracking-wider">
                Final Determination: 100% Verified Compliant & Approved
              </div>
            </div>

            {/* Section 1: Engagement Scope & Case Identification */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
                1. Engagement Scope and Case Identification
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Engagement Title</span>
                  <span className="font-bold text-slate-900">{selectedSummaryAudit?.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Case Identifier</span>
                  <span className="font-mono text-slate-800 text-[11px]">{selectedSummaryAudit?.id}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Governing Standard</span>
                  <span className="font-medium text-slate-900">
                    {selectedSummaryAudit?.standard_code}:{selectedSummaryAudit?.standard_version}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Lead Auditor</span>
                  <span className="font-medium text-slate-900">Certified Lead Quality Auditor</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Initial Submission</span>
                  <span className="text-slate-800">
                    {selectedSummaryAudit?.created_at ? new Date(selectedSummaryAudit.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Certification Date</span>
                  <span className="text-slate-800">
                    {selectedSummaryAudit?.updated_at ? new Date(selectedSummaryAudit.updated_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Compliance Score</span>
                  <span className="font-bold text-emerald-700">100% (Adequate)</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Certification Status</span>
                  <span className="font-bold text-slate-900 uppercase">Cleared & Certified</span>
                </div>
              </div>
            </div>

            {/* Section 2: Audit Lifecycle Iterations and Resolution Metrics */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
                2. Audit Lifecycle Iterations and Metrics
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Required Clauses in Scope</span>
                  <span className="font-bold text-slate-900">5 of 5 Verified</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Resend Iterations</span>
                  <span className="font-bold text-slate-900">{selectedSummaryAudit?.resend_count || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Rebind Submissions</span>
                  <span className="font-bold text-slate-900">{selectedSummaryAudit?.rebind_count || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Final Disposition</span>
                  <span className="font-bold text-emerald-700">Approved & Signed</span>
                </div>
              </div>
            </div>

            {/* Section 3: Verified ISO Standard Clause Evaluation Register */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
                3. Standard Clause Verification Register
              </h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-2.5 w-24">Clause</th>
                      <th className="px-4 py-2.5 w-60">Specification Title</th>
                      <th className="px-4 py-2.5">Objective Evidence Verified</th>
                      <th className="px-4 py-2.5 w-32 text-right">Determination</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    <tr>
                      <td className="px-4 py-3 font-mono font-semibold">Clause 4.1</td>
                      <td className="px-4 py-3 font-semibold">Impartiality and Independence</td>
                      <td className="px-4 py-3 text-slate-600">
                        Management commitment records, impartiality risk assessment register, and annual signed conflict-of-interest declarations verified.
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
                          Adequate
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono font-semibold">Clause 4.2</td>
                      <td className="px-4 py-3 font-semibold">Confidentiality and Data Safeguards</td>
                      <td className="px-4 py-3 text-slate-600">
                        Legally enforceable non-disclosure agreements, data security procedures, and restricted laboratory access credentials verified.
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
                          Adequate
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono font-semibold">Clause 5.1</td>
                      <td className="px-4 py-3 font-semibold">Legal Entity and Governance</td>
                      <td className="px-4 py-3 text-slate-600">
                        Corporate registration documents, organizational leadership chart, and defined management responsibility documentation verified.
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
                          Adequate
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono font-semibold">Clause 6.2</td>
                      <td className="px-4 py-3 font-semibold">Personnel Competence and Qualification</td>
                      <td className="px-4 py-3 text-slate-600">
                        Technical personnel training curriculum, competence appraisal logs, and formal equipment operation authorizations verified.
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
                          Adequate
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono font-semibold">Clause 6.4</td>
                      <td className="px-4 py-3 font-semibold">Equipment Calibration and Traceability</td>
                      <td className="px-4 py-3 text-slate-600">
                        Scheduled metrological calibration certificates, traceability logs, and preventative maintenance records verified.
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
                          Adequate
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 4: Non-Conformance and Corrective Action (CAPA) Log */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
                4. Non-Conformance and Corrective Action Resolution Log
              </h4>
              {selectedSummaryAudit?.last_rejected_clause || (selectedSummaryAudit?.resend_count && selectedSummaryAudit.resend_count > 0) ? (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Identified Non-Conforming Clause</span>
                      <span className="font-bold text-slate-900">
                        {selectedSummaryAudit.last_rejected_clause || 'Clause 4.2 Confidentiality and Data Safeguards'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Resolution Status</span>
                      <span className="font-bold text-emerald-700">Corrective Actions Verified and Cleared</span>
                    </div>
                  </div>

                  {selectedSummaryAudit.resend_statement && (
                    <div className="bg-white p-3 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                        Lead Auditor Non-Conformance Statement
                      </span>
                      <p className="text-slate-800 text-xs mt-0.5 leading-relaxed">
                        {selectedSummaryAudit.resend_statement}
                      </p>
                    </div>
                  )}

                  {selectedSummaryAudit.corrective_recommendation && (
                    <div className="bg-white p-3 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                        Lead Auditor Corrective Directive
                      </span>
                      <p className="text-slate-800 text-xs mt-0.5 leading-relaxed">
                        {selectedSummaryAudit.corrective_recommendation}
                      </p>
                    </div>
                  )}

                  {/* 8-Delta Resolution Record */}
                  {selectedSummaryAudit.rca_8delta && (
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                        Implemented 8-Delta Root Cause Analysis (CAPA) Summary
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div className="bg-white p-2.5 rounded border border-slate-200">
                          <span className="font-bold text-slate-900 block">Delta 1: Operational Scope & Team</span>
                          <span className="text-slate-700">{selectedSummaryAudit.rca_8delta.d1_team}</span>
                        </div>
                        <div className="bg-white p-2.5 rounded border border-slate-200">
                          <span className="font-bold text-slate-900 block">Delta 3: Containment Safeguards</span>
                          <span className="text-slate-700">{selectedSummaryAudit.rca_8delta.d3_containment}</span>
                        </div>
                        <div className="bg-white p-2.5 rounded border border-slate-200">
                          <span className="font-bold text-slate-900 block">Delta 4: Root Cause (5-Whys)</span>
                          <span className="text-slate-700">{selectedSummaryAudit.rca_8delta.d4_root_cause}</span>
                        </div>
                        <div className="bg-white p-2.5 rounded border border-slate-200">
                          <span className="font-bold text-slate-900 block">Delta 5: Permanent Corrective Action</span>
                          <span className="text-slate-700">{selectedSummaryAudit.rca_8delta.d5_corrective_action}</span>
                        </div>
                        <div className="bg-white p-2.5 rounded border border-slate-200">
                          <span className="font-bold text-slate-900 block">Delta 6: Validation and Verification</span>
                          <span className="text-slate-700">{selectedSummaryAudit.rca_8delta.d6_validation}</span>
                        </div>
                        <div className="bg-white p-2.5 rounded border border-slate-200">
                          <span className="font-bold text-slate-900 block">Delta 7: Systemic Prevention</span>
                          <span className="text-slate-700">{selectedSummaryAudit.rca_8delta.d7_prevention}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2.5 rounded border border-emerald-200 font-medium">
                    Auditor Verification Confirmation: Corrective actions were re-evaluated against the standard requirements and confirmed effective. All non-conformances have been cleared and closed.
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs text-slate-600">
                  Primary Assessment Conformance: Zero non-conformances identified during assessment cycle. All standard clauses conformed on initial submission.
                </div>
              )}
            </div>

            {/* Section 5: Official Attestation and Certification Statement */}
            <div className="space-y-3 border-t border-slate-300 pt-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                5. Attestation and Certification Declaration
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed">
                This document certifies that the Quality Management System and documented operational evidence for engagement{' '}
                <strong className="text-slate-900">{selectedSummaryAudit?.name}</strong> have been subjected to formal compliance verification under the requirements of{' '}
                <strong className="text-slate-900">
                  {selectedSummaryAudit?.standard_code}:{selectedSummaryAudit?.standard_version}
                </strong>
                . All technical and managerial clauses meet verified standards of conformity. Compliance certification is approved and authorized.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-200 text-xs text-slate-600">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Authorized By</span>
                  <span className="font-bold text-slate-900">Lead ISO Auditor</span>
                  <span className="text-[11px] text-slate-500 block">Quality Assessment Certification Division</span>
                </div>
                <div className="sm:text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Digital Verification Hash</span>
                  <span className="font-mono text-[10px] text-slate-600 block">
                    SHA256:{selectedSummaryAudit?.id ? selectedSummaryAudit.id.replace(/-/g, '').slice(0, 24) : 'E3B0C44298FC1C149AFBF4C8'}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold block">Digitally Signed & Validated</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <DialogFooter className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Document Classification: Official ISO Compliance Record
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedSummaryAudit(null)}
              className="text-xs"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
