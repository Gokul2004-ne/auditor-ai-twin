'use client'

import React from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Network,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  FileText
} from 'lucide-react'
import type { Audit, Standard } from '@/types'

export default function DashboardPage() {
  const { data: audits = [], isLoading: auditsLoading } = useQuery<Audit[]>({
    queryKey: ['audits'],
    queryFn: async () => {
      const res = await apiClient.get('/api/audits')
      return res.data
    },
  })

  const { data: standards = [] } = useQuery<Standard[]>({
    queryKey: ['standards'],
    queryFn: async () => {
      const res = await apiClient.get('/api/standards')
      return res.data
    },
  })

  // Calculate metrics
  const totalAudits = audits.length
  const completedAudits = audits.filter(a => a.status === 'approved' || a.status === 'signed').length
  const inProgressAudits = audits.filter(a => a.status === 'processing' || a.status === 'under_review' || a.status === 'resubmitted').length
  const resubmittedAudits = audits.filter(a => a.status === 'resubmitted').length
  const avgScore = totalAudits > 0 
    ? Math.round(audits.reduce((acc, curr) => acc + (curr.overall_score || 0), 0) / totalAudits)
    : 0

  return (
    <div className="space-y-8">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-400/30">
            <Sparkles className="w-3.5 h-3.5" /> ISO Compliance Autonomous Twin
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Lead Auditor Command Center
          </h1>
          <p className="text-slate-300 text-sm max-w-xl">
            Autonomous multi-standard auditing powered by Neo4j Knowledge Graph, Qdrant vector retrieval, and Gemini reasoning.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/audits">
            <Button className="bg-blue-600 hover:bg-blue-500 text-white gap-2 shadow-md">
              <FileCheck2 className="w-4 h-4" /> Review Audit Documents
            </Button>
          </Link>
          <Link href="/standards">
            <Button variant="outline" className="border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 gap-2">
              <Network className="w-4 h-4" /> Knowledge Graph
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Audits
            </CardTitle>
            <FileCheck2 className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalAudits}</div>
            <p className="text-xs text-slate-500 mt-1">Across all ISO standards</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active In-Review
            </CardTitle>
            <Clock className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{inProgressAudits}</div>
            <p className="text-xs text-slate-500 mt-1">
              {resubmittedAudits > 0 ? `${resubmittedAudits} resubmitted by auditee` : 'Awaiting human review'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Mean Compliance Score
            </CardTitle>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{avgScore}%</div>
            <p className="text-xs text-slate-500 mt-1">Average compliance index</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Standards Loaded
            </CardTitle>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{standards.length || 3}</div>
            <p className="text-xs text-slate-500 mt-1">52 clauses & mappings indexed</p>
          </CardContent>
        </Card>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Audits Table */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">Recent Audits</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Submissions and reviews executed against evidence documents
                </CardDescription>
              </div>
              <Link href="/audits" className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {auditsLoading ? (
                <div className="p-8 text-center text-sm text-slate-400">Loading audit records...</div>
              ) : audits.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <div className="mx-auto w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-medium text-slate-700">No audits found</div>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Client audit submissions from Auditees will appear here for your review.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {audits.slice(0, 5).map((audit) => {
                    const isResended = audit.status === 'resended' || audit.workflow_status === 'resended' || audit.status === 'rejected'
                    const isRebinded = audit.status === 'rebinded' || audit.workflow_status === 'rebinded' || audit.status === 'resubmitted'
                    const resendCount = audit.resend_count || 1
                    const rebindCount = audit.rebind_count || 1

                    return (
                      <div key={audit.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Link href={`/audits/review/?id=${audit.id}`} className="font-semibold text-sm text-slate-900 hover:text-blue-600 truncate">
                              {audit.name}
                            </Link>
                            <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                              {audit.standard_code}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500">
                            Created {new Date(audit.created_at).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right hidden sm:block">
                            <span className="text-xs font-semibold text-slate-800">
                              {audit.status === 'approved' || audit.workflow_status === 'approved'
                                ? '100% Score'
                                : audit.overall_score !== null && audit.overall_score !== undefined && audit.overall_score > 0
                                ? `${Math.round(audit.overall_score)}% Score`
                                : typeof audit.last_rejected_clause_index === 'number' && audit.last_rejected_clause_index > 0
                                ? `${Math.round((audit.last_rejected_clause_index / 5) * 100)}% Score`
                                : audit.last_rejected_clause?.includes('4.2')
                                ? '20% Score'
                                : 'Pending Score'}
                            </span>
                          </div>

                          {isResended ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              Resended {resendCount > 1 ? `(${resendCount})` : ''}
                            </span>
                          ) : isRebinded ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
                              <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
                              Rebinded {rebindCount > 1 ? `(${rebindCount})` : ''}
                            </span>
                          ) : (
                            <Badge
                              variant={
                                audit.status === 'signed' || audit.status === 'approved'
                                  ? 'default'
                                  : audit.status === 'processing'
                                  ? 'secondary'
                                  : 'outline'
                              }
                              className="capitalize text-[10px]"
                            >
                              {audit.status.replace('_', ' ')}
                            </Badge>
                          )}

                          <Link href={`/audits/review/?id=${audit.id}`}>
                            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 hover:text-blue-600 font-semibold">
                              Review <ArrowRight className="w-3 h-3" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Standards & Engines Overview */}
        <div className="space-y-4">
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-900">Covered ISO Standards</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Audited via Neo4j Knowledge Graph mappings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">ISO/IEC 17025:2017</span>
                  <Badge variant="outline" className="text-[10px] bg-white font-mono">Active</Badge>
                </div>
                <p className="text-[11px] text-slate-500">Testing & Calibration Laboratories Competence</p>
              </div>

              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">ISO/IEC/IEEE 12207:2017</span>
                  <Badge variant="outline" className="text-[10px] bg-white font-mono">Active</Badge>
                </div>
                <p className="text-[11px] text-slate-500">Software Lifecycle Processes & Engineering</p>
              </div>

              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">ISO/IEC 15504:2004</span>
                  <Badge variant="outline" className="text-[10px] bg-white font-mono">Active</Badge>
                </div>
                <p className="text-[11px] text-slate-500">Information Technology Process Assessment</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
