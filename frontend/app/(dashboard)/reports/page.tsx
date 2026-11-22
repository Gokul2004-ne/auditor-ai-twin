'use client'

import React from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  FileSignature,
  FileText,
  Download,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react'

export default function ReportsListPage() {
  const { data: reports = [], isLoading } = useQuery<any[]>({
    queryKey: ['reports'],
    queryFn: async () => {
      const res = await apiClient.get('/api/reports')
      return res.data
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Audit Reports & Signatures</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review drafted compliance statements, download official PDFs, and apply digital signatures
          </p>
        </div>
      </div>

      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-sm text-slate-400">Loading audit reports...</div>
          ) : reports.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <FileSignature className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">No Reports Generated Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Execute an audit first, then click "Compile & Sign Report" to draft an official ISO audit report.
              </p>
              <Link href="/audits">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white mt-2">
                  Go to Audits
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3.5">Report Title</th>
                    <th className="px-6 py-3.5">Audit Reference</th>
                    <th className="px-6 py-3.5">Version</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/reports/view/?id=${report.id}`} className="font-semibold text-slate-900 hover:text-blue-600 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>{report.title || 'Official ISO Audit Report'}</span>
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-500">
                        {report.audit_id?.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4 font-mono">
                        <Badge variant="outline" className="text-[10px] bg-white">
                          v{report.current_version || report.version || 1}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            report.status === 'signed'
                              ? 'default'
                              : report.status === 'finalized'
                              ? 'secondary'
                              : 'outline'
                          }
                          className="capitalize text-[10px]"
                        >
                          {report.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(report.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/reports/view/?id=${report.id}`}>
                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                              View & Sign <ArrowRight className="w-3 h-3" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
