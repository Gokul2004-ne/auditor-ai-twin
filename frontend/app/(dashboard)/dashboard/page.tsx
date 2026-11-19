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
  Plus,
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
  const inProgressAudits = audits.filter(a => a.status === 'processing' || a.status === 'under_review').length
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
            Enterprise ISO Audit Intelligence
          </h1>
          <p className="text-slate-300 text-sm max-w-xl">
            Autonomous multi-standard auditing powered by Neo4j Knowledge Graph, Qdrant vector retrieval, and Gemini reasoning.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/audits/new">
            <Button className="bg-blue-600 hover:bg-blue-500 text-white gap-2 shadow-md">
              <Plus className="w-4 h-4" /> Start New Audit
            </Button>
          </Link>
          <Link href="/standards">
            <Button variant="outline" className="border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 gap-2">
              <Network className="w-4 h-4 text-blue-400" /> Standards Graph
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
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
            <p className="text-xs text-slate-500 mt-1">Across all organizations</p>
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
            <p className="text-xs text-slate-500 mt-1">Awaiting human review or sign-off</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Avg. Compliance
            </CardTitle>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{avgScore}%</div>
            <div className="w-full mt-2">
              <Progress value={avgScore} className="h-1.5" />
            </div>
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
                  Audits executed against evidence documents
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
                    Upload an evidence document (such as a quality manual or engineering SOP) to perform your first autonomous audit.
                  </p>
                  <Link href="/audits/new">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white mt-2">
                      <Plus className="w-4 h-4 mr-1.5" /> New Audit
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {audits.slice(0, 5).map((audit) => (
                    <div key={audit.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Link href={`/audits/${audit.id}`} className="font-semibold text-sm text-slate-900 hover:text-blue-600 truncate">
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
                            {audit.overall_score !== null && audit.overall_score !== undefined
                              ? `${Math.round(audit.overall_score)}% Score`
                              : 'Pending Score'}
                          </span>
                        </div>

                        <Badge
                          variant={
                            audit.status === 'signed' || audit.status === 'approved'
                              ? 'default'
                              : audit.status === 'processing'
                              ? 'secondary'
                              : 'outline'
                          }
                          className="capitalize text-xs"
                        >
                          {audit.status.replace('_', ' ')}
                        </Badge>

                        <Link href={`/audits/${audit.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ArrowRight className="w-4 h-4 text-slate-400" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Knowledge Graph Snapshot */}
        <div className="space-y-4">
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-slate-900">Supported Standards</CardTitle>
                <Network className="w-4 h-4 text-blue-600" />
              </div>
              <CardDescription className="text-xs text-slate-500">
                Neo4j Graph Database status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                  17025
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-900">ISO/IEC 17025:2017</h4>
                  <p className="text-[11px] text-slate-500">Testing & calibration laboratories competence</p>
                  <span className="inline-block mt-1 text-[10px] text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    28 Clauses • Cross-mapped
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xs shrink-0">
                  12207
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-900">ISO/IEC/IEEE 12207:2017</h4>
                  <p className="text-[11px] text-slate-500">Systems and software engineering lifecycle processes</p>
                  <span className="inline-block mt-1 text-[10px] text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    18 Clauses • Active
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                  15504
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-900">ISO/IEC 15504-1:2004</h4>
                  <p className="text-[11px] text-slate-500">Information technology process assessment (SPICE)</p>
                  <span className="inline-block mt-1 text-[10px] text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    6 Clauses • Mapped to 12207
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Link href="/standards">
                  <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 border-slate-300">
                    <Network className="w-3.5 h-3.5 text-blue-600" />
                    Open Knowledge Graph Explorer
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
