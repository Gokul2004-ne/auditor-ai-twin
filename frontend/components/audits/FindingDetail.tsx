'use client'

import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Sparkles,
  ShieldCheck,
  Check,
  X,
  Edit2,
  BookOpen
} from 'lucide-react'
import { toast } from 'sonner'
import apiClient from '@/lib/api/client'
import type { Finding } from '@/types'

interface FindingDetailProps {
  finding: Finding | null
  onUpdateFinding: (updated: Finding) => void
}

export function FindingDetail({ finding, onUpdateFinding }: FindingDetailProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  if (!finding) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs">
        Select a finding from the left table to inspect compliance reasoning and source evidence.
      </div>
    )
  }

  const handleAccept = async () => {
    setIsUpdating(true)
    try {
      const res = await apiClient.post(`/api/findings/${finding.id}/accept`)
      toast.success('Finding accepted and logged')
      onUpdateFinding(res.data)
    } catch (err: any) {
      toast.error('Failed to accept finding')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleReject = async () => {
    setIsUpdating(true)
    try {
      const res = await apiClient.post(`/api/findings/${finding.id}/reject`, {
        reason: 'Overridden by Lead Auditor upon manual evidence inspection.'
      })
      toast.success('Finding marked as rejected/overridden')
      onUpdateFinding(res.data)
    } catch (err: any) {
      toast.error('Failed to reject finding')
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300'
      case 'partially_compliant':
        return 'bg-amber-50 text-amber-700 border-amber-300'
      case 'non_compliant':
        return 'bg-rose-50 text-rose-700 border-rose-300'
      default:
        return 'bg-slate-50 text-slate-700 border-slate-300'
    }
  }

  const evidenceList = finding.audit_evidence || []

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between mb-1.5">
          <Badge variant="outline" className={`font-semibold capitalize text-xs ${getStatusColor(finding.status)}`}>
            {finding.status.replace('_', ' ')}
          </Badge>
          {finding.confidence && (
            <span className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
              {Math.round(finding.confidence * 100)}% Confidence
            </span>
          )}
        </div>
        <h3 className="font-semibold text-sm text-slate-900 leading-snug">
          {finding.summary || 'Audit Finding Assessment'}
        </h3>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Auditor Verification Actions */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Auditor Review:</span>
            <span className="capitalize font-bold text-slate-900">
              {finding.auditor_status || finding.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={isUpdating}
              onClick={handleAccept}
              className="h-7 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-200 gap-1"
            >
              <Check className="w-3.5 h-3.5" /> Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isUpdating}
              onClick={handleReject}
              className="h-7 text-xs text-rose-700 hover:text-rose-800 hover:bg-rose-50 border-rose-200 gap-1"
            >
              <X className="w-3.5 h-3.5" /> Reject
            </Button>
          </div>
        </div>

        {/* Reasoning / Gap Analysis */}
        <div>
          <h4 className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" /> AI Twin Analysis & Reasoning
          </h4>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 leading-relaxed">
            {finding.reasoning || 'No analysis recorded.'}
          </div>
        </div>

        {/* Missing Evidence / Deficiencies */}
        {finding.missing_evidence && (
          <div>
            <h4 className="font-semibold text-rose-800 mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Missing Evidence / Deficiencies
            </h4>
            <div className="p-3 bg-rose-50/60 rounded-lg border border-rose-200 text-rose-900 leading-relaxed">
              {finding.missing_evidence}
            </div>
          </div>
        )}

        {/* Auditor Recommendation */}
        {finding.recommendation && (
          <div>
            <h4 className="font-semibold text-blue-900 mb-1 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" /> Corrective Recommendation
            </h4>
            <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200 text-blue-950 leading-relaxed">
              {finding.recommendation}
            </div>
          </div>
        )}

        {/* Evidence Sources */}
        <div>
          <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-500" /> Source Evidence ({evidenceList.length})
          </h4>
          {evidenceList.length === 0 ? (
            <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-lg border border-slate-200">
              No direct documentary evidence excerpt attached for this clause.
            </div>
          ) : (
            <div className="space-y-2">
              {evidenceList.map((ev, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-800">
                      {ev.section_title || 'Document Excerpt'}
                    </span>
                    <span className="font-mono text-slate-500">
                      Page {ev.page_number || 'N/A'} • Sim: {ev.similarity_score ? `${Math.round(ev.similarity_score * 100)}%` : 'Direct'}
                    </span>
                  </div>
                  <blockquote className="p-2 bg-white rounded border-l-2 border-blue-600 text-[11px] text-slate-600 font-mono italic">
                    "{ev.text_excerpt}"
                  </blockquote>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
