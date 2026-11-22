'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  Plus,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Building2,
  Loader2,
  ArrowRight
} from 'lucide-react'
import { VoiceMessageInput } from '@/components/shared/VoiceMessageInput'
import { toast } from 'sonner'
import type { Audit } from '@/types'

const STANDARDS = [
  { id: 'ISO17025:2017', code: 'ISO/IEC 17025', version: '2017', name: 'Testing & Calibration Laboratories' },
  { id: 'ISO12207:2017', code: 'ISO/IEC/IEEE 12207', version: '2017', name: 'Software Lifecycle Processes' },
  { id: 'ISO15504:2004', code: 'ISO/IEC 15504', version: '2004', name: 'Process Assessment (SPICE)' },
]

export default function AuditeeDocumentsPage() {
  const queryClient = useQueryClient()
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [selectedStandard, setSelectedStandard] = useState(STANDARDS[0])
  const [optionalFile, setOptionalFile] = useState<File | null>(null)
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch audits
  const { data: audits = [], isLoading } = useQuery<Audit[]>({
    queryKey: ['audits'],
    queryFn: async () => {
      const res = await apiClient.get('/api/audits')
      return res.data
    },
  })

  // Complete when Title and Description are filled
  const isFormComplete = title.trim().length > 0 && description.trim().length > 0

  const handleStartNewAudit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormComplete) {
      toast.error('Please complete both Title and Description.')
      return
    }

    setIsSubmitting(true)
    try {
      toast.info('Initiating audit engagement and binding ISO standard clauses...')

      // 1. Create audit engagement
      const auditRes = await apiClient.post('/api/audits', {
        name: title.trim(),
        standard_code: selectedStandard.code,
        standard_version: selectedStandard.version,
      })
      const auditId = auditRes.data.id

      // 2. Bind default standard clauses
      const defaultClauseIds = [
        `${selectedStandard.id}:4.1`,
        `${selectedStandard.id}:4.2`,
        `${selectedStandard.id}:5.1`,
        `${selectedStandard.id}:6.2`,
        `${selectedStandard.id}:6.4`,
      ]
      try {
        await apiClient.post(`/api/audits/${auditId}/clauses`, { clause_ids: defaultClauseIds })
      } catch (e) {
        console.warn('Clause binding notice:', e)
      }

      // 3. Upload optional attached file if provided via pin
      if (optionalFile) {
        try {
          const formData = new FormData()
          formData.append('audit_id', auditId)
          formData.append('file', optionalFile)
          formData.append('description', description)

          const docRes = await apiClient.post('/api/documents', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
          apiClient.post(`/api/documents/${docRes.data.id}/process`).catch(console.error)
        } catch (e) {
          console.warn('File upload note:', e)
        }
      }

      // 4. Trigger initial AI evaluation & set status to under_review
      try {
        await apiClient.post(`/api/audits/${auditId}/run`)
      } catch (e) {
        console.warn('Run assessment notice:', e)
      }

      await apiClient.patch(`/api/audits/${auditId}`, {
        status: 'under_review',
        workflow_status: 'under_review',
      })

      toast.success('Audit engagement created and submitted for Auditor review!')
      queryClient.invalidateQueries({ queryKey: ['audits'] })

      // Reset form & close modal
      setTitle('')
      setOptionalFile(null)
      setDescription('')
      setIsNewModalOpen(false)
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.detail || err.message || 'Failed to submit audit')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header section with Start New Audit button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Audity Documents & Engagements</h1>
          <p className="text-xs text-slate-500 mt-1">
            Submit quality documentation, track audit findings, and collaborate with Lead Auditors
          </p>
        </div>
        <Button
          onClick={() => setIsNewModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" /> Start New Audit
        </Button>
      </div>

      {/* Audits Table */}
      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-sm text-slate-400">Loading your audit engagements...</div>
          ) : audits.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">No Audits Initiated</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click Start New Audit to create an engagement and submit for ISO compliance review.
              </p>
              <Button
                onClick={() => setIsNewModalOpen(true)}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white mt-2"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Start New Audit
              </Button>
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
                    <th className="px-6 py-3.5">Submission Date</th>
                    <th className="px-6 py-3.5 text-right">Review Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {audits.map((audit) => {
                    const isApproved = audit.status === 'approved' || audit.status === 'signed'
                    const isResended =
                      audit.status === 'resended' ||
                      audit.workflow_status === 'resended' ||
                      audit.status === 'rejected'
                    const isRebinded =
                      audit.status === 'rebinded' ||
                      audit.workflow_status === 'rebinded' ||
                      audit.status === 'resubmitted'

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

                    const resendCount = audit.resend_count || 1
                    const rebindCount = audit.rebind_count || 1

                    return (
                      <tr
                        key={audit.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isResended ? 'bg-rose-50/40' : isRebinded ? 'bg-purple-50/30' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <span className={`font-semibold block ${isResended ? 'text-rose-950' : 'text-slate-900'}`}>
                            {audit.name}
                          </span>
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
                              variant={
                                audit.status === 'processing'
                                  ? 'secondary'
                                  : 'outline'
                              }
                              className="capitalize text-[10px]"
                            >
                              {audit.status.replace('_', ' ')}
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {score !== null ? (
                            <div className="w-32 space-y-1">
                              <div className="flex justify-between text-[11px] font-semibold text-slate-800">
                                <span>{score}%</span>
                                <span className={score >= 70 ? 'text-emerald-600' : 'text-amber-600'}>
                                  {score >= 70 ? 'Compliant' : 'Deficiencies'}
                                </span>
                              </div>
                              <Progress value={score} className="h-1.5" />
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Pending evaluation</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(audit.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-slate-500 text-xs">
                            {isApproved ? (
                              <span className="text-emerald-600 font-medium flex items-center justify-end gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Certified
                              </span>
                            ) : isResended ? (
                              <Link
                                href="/auditee/dashboard"
                                className="inline-flex items-center gap-1 text-rose-600 font-bold hover:text-rose-800 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200 transition-colors"
                              >
                                Resolve & Rebind (8-Delta RCA) &rarr;
                              </Link>
                            ) : isRebinded ? (
                              <span className="text-purple-700 font-medium">Awaiting Auditor</span>
                            ) : (
                              <span className="text-slate-400 italic">In Review</span>
                            )}
                          </span>
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

      {/* Start New Audit Modal */}
      <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
        <DialogContent className="max-w-xl bg-white p-6 rounded-xl shadow-xl border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              Start New ISO Compliance Audit
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Provide engagement title and enter or dictate description to submit for auditor review.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleStartNewAudit} className="space-y-5 pt-3">
            {/* 1st Option: Audit Engagement Title */}
            <div className="space-y-1.5">
              <Label htmlFor="auditTitle" className="text-xs font-semibold text-slate-800 flex items-center justify-between">
                <span>1. Audit Engagement Title <span className="text-rose-500">*</span></span>
                {title.trim().length > 0 && (
                  <span className="text-emerald-600 text-[11px] flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3 h-3" /> Completed
                  </span>
                )}
              </Label>
              <Input
                id="auditTitle"
                placeholder="e.g. Acme Lab ISO 17025 Quality Verification"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="h-10 text-sm border-slate-300"
              />
            </div>

            {/* Target Standard Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Target ISO Standard</Label>
              <div className="grid grid-cols-3 gap-2">
                {STANDARDS.map((std) => (
                  <button
                    key={std.id}
                    type="button"
                    onClick={() => setSelectedStandard(std)}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      selectedStandard.id === std.id
                        ? 'border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-500 text-emerald-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-semibold text-xs">{std.code}</div>
                    <div className="text-[10px] text-slate-500 truncate">{std.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2nd Option: Description Box (WhatsApp styled with pin & mic) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-800 flex items-center justify-between">
                <span>2. Description Box (Type or Dictate via Mic) <span className="text-rose-500">*</span></span>
                {description.trim().length > 0 && (
                  <span className="text-emerald-600 text-[11px] flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3 h-3" /> Description provided
                  </span>
                )}
              </Label>
              <p className="text-[11px] text-slate-500">
                Type your description or click the mic 🎙️ to dictate live. You can optionally attach supporting documents using the pin 📎.
              </p>

              {/* WhatsApp styled VoiceMessageInput component */}
              <VoiceMessageInput
                value={description}
                onChange={setDescription}
                selectedFile={optionalFile}
                onFileSelect={setOptionalFile}
                placeholder="Type audit notes or click mic to speak..."
              />
            </div>

            {/* Completion checklist info */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs flex items-center justify-between">
              <span className="text-slate-600 font-medium">Submission Status:</span>
              <div className="flex items-center gap-3 text-[11px]">
                <span className={title.trim() ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                  {title.trim() ? '✓' : '○'} Title
                </span>
                <span className={description.trim() ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                  {description.trim() ? '✓' : '○'} Description
                </span>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewModalOpen(false)}
                disabled={isSubmitting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isFormComplete || isSubmitting}
                className={`text-xs gap-2 ${
                  isFormComplete
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting to Auditor...</span>
                  </>
                ) : (
                  <>
                    <Building2 className="w-4 h-4" />
                    <span>Submit Audit Engagement</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
