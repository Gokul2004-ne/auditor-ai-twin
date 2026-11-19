'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { FindingDetail } from '@/components/audits/FindingDetail'
import { toast } from 'sonner'
import {
  FileCheck2,
  FileSignature,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText
} from 'lucide-react'
import type { Audit, Finding } from '@/types'

export default function AuditReviewPage() {
  const params = useParams()
  const router = useRouter()
  const auditId = params.auditId as string

  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

  // Fetch Audit details
  const { data: audit, refetch: refetchAudit, isLoading: auditLoading } = useQuery<Audit>({
    queryKey: ['audit', auditId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/audits/${auditId}`)
      return res.data
    },
  })

  // Fetch Findings
  const { data: findings = [], refetch: refetchFindings, isLoading: findingsLoading } = useQuery<Finding[]>({
    queryKey: ['audit-findings', auditId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/audits/${auditId}/findings`)
      return res.data
    },
  })

  // Auto-select first finding if not set
  React.useEffect(() => {
    if (findings.length > 0 && !selectedFindingId) {
      setSelectedFindingId(findings[0].id)
    }
  }, [findings, selectedFindingId])

  const selectedFinding = findings.find((f) => f.id === selectedFindingId) || findings[0] || null

  const handleUpdateFinding = (updated: Finding) => {
    refetchFindings()
    refetchAudit()
  }

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true)
    try {
      toast.info('Generating official audit report with Gemini summary & ReportLab PDF...')
      const res = await apiClient.post(`/api/audits/${auditId}/report`)
      toast.success('Report successfully compiled!')
      router.push(`/reports/${res.data.id}`)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to generate report')
    } finally {
      setIsGeneratingReport(false)
    }
  }

  // Filter findings
  const filteredFindings = findings.filter((f) => {
    if (statusFilter === 'all') return true
    return f.status === statusFilter
  })

  // Calculate stats
  const compliantCount = findings.filter((f) => f.status === 'compliant').length
  const partialCount = findings.filter((f) => f.status === 'partially_compliant').length
  const nonCompliantCount = findings.filter((f) => f.status === 'non_compliant').length
  const totalFindings = findings.length

  const score = audit?.overall_score !== null && audit?.overall_score !== undefined
    ? Math.round(audit.overall_score)
    : 0

  return (
    <div className="space-y-6 h-[calc(100vh-6.5rem)] flex flex-col">
      {/* Top Banner / Actions */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              {audit?.name || 'Audit Review'}
            </h1>
            <Badge variant="outline" className="font-mono text-xs bg-slate-50">
              {audit?.standard_code}
            </Badge>
            <Badge className="capitalize text-xs">
              {audit?.status?.replace('_', ' ') || 'Under Review'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500">
            Audit ID: {auditId} • {totalFindings} Clauses Evaluated
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleGenerateReport}
            disabled={isGeneratingReport}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs gap-1.5 shadow-sm"
          >
            <FileSignature className="w-4 h-4" />
            {isGeneratingReport ? 'Generating Report...' : 'Compile & Sign Report'}
          </Button>
        </div>
      </div>

      {/* Score & Category KPI bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-semibold text-slate-500 uppercase">Compliance Index</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{score}%</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
            {score >= 80 ? 'A' : score >= 60 ? 'B' : 'C'}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'compliant' ? 'all' : 'compliant')}
          className={`bg-white p-3 rounded-xl border cursor-pointer transition-colors shadow-xs ${
            statusFilter === 'compliant' ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/20' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">Compliant</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-600 mt-0.5">{compliantCount}</div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'partially_compliant' ? 'all' : 'partially_compliant')}
          className={`bg-white p-3 rounded-xl border cursor-pointer transition-colors shadow-xs ${
            statusFilter === 'partially_compliant' ? 'border-amber-500 ring-1 ring-amber-500 bg-amber-50/20' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">Partially Compliant</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-600 mt-0.5">{partialCount}</div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'non_compliant' ? 'all' : 'non_compliant')}
          className={`bg-white p-3 rounded-xl border cursor-pointer transition-colors shadow-xs ${
            statusFilter === 'non_compliant' ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-50/20' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">Non-Compliant</span>
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-xl font-bold text-rose-600 mt-0.5">{nonCompliantCount}</div>
        </div>
      </div>

      {/* Main 2-Column: Findings Table & Inspector */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
        {/* Left: Findings Table (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
            <span className="text-xs font-semibold text-slate-800">
              Evaluated Clauses ({filteredFindings.length})
            </span>
            {statusFilter !== 'all' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStatusFilter('all')}
                className="h-6 text-[10px] text-blue-600"
              >
                Reset Filter
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {findingsLoading ? (
              <div className="p-12 text-center text-xs text-slate-400">Loading findings...</div>
            ) : filteredFindings.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No findings match the current filter.
              </div>
            ) : (
              filteredFindings.map((finding) => {
                const isSelected = selectedFinding?.id === finding.id
                return (
                  <div
                    key={finding.id}
                    onClick={() => setSelectedFindingId(finding.id)}
                    className={`p-3.5 cursor-pointer transition-colors flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-blue-50/80 border-l-4 border-blue-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-[10px] capitalize font-medium ${
                            finding.status === 'compliant'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : finding.status === 'partially_compliant'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {finding.status.replace('_', ' ')}
                        </Badge>
                        <span className="font-semibold text-xs text-slate-900 truncate">
                          {finding.summary || 'Clause Finding'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2">
                        {finding.reasoning}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      {finding.confidence && (
                        <span className="text-[10px] font-mono text-slate-400 block">
                          {Math.round(finding.confidence * 100)}% Conf
                        </span>
                      )}
                      <ArrowRight className={`w-3.5 h-3.5 mt-1 ml-auto ${isSelected ? 'text-blue-600' : 'text-slate-300'}`} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right: Finding Inspector & Evidence (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <FindingDetail finding={selectedFinding} onUpdateFinding={handleUpdateFinding} />
        </div>
      </div>
    </div>
  )
}
