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
  Plus,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Clock,
  FileSignature
} from 'lucide-react'
import type { Audit } from '@/types'

export default function AuditsListPage() {
  const { data: audits = [], isLoading } = useQuery<Audit[]>({
    queryKey: ['audits'],
    queryFn: async () => {
      const res = await apiClient.get('/api/audits')
      return res.data
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Audit Engagements</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage ISO compliance audits, review evidence findings, and issue reports
          </p>
        </div>
        <Link href="/audits/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-xs">
            <Plus className="w-4 h-4" /> Start New Audit
          </Button>
        </Link>
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
              <h3 className="text-sm font-semibold text-slate-800">No Audits Created Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Begin by initiating a new audit engagement against ISO 17025, 12207, or 15504 with an uploaded document.
              </p>
              <Link href="/audits/new">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white mt-2">
                  <Plus className="w-4 h-4 mr-1.5" /> Start New Audit
                </Button>
              </Link>
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
                    const score = audit.overall_score !== null && audit.overall_score !== undefined
                      ? Math.round(audit.overall_score)
                      : null

                    return (
                      <tr key={audit.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <Link href={`/audits/${audit.id}`} className="font-semibold text-slate-900 hover:text-blue-600">
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
                            <span className="text-slate-400 italic">Not evaluated</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(audit.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/audits/${audit.id}`}>
                              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
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
    </div>
  )
}
