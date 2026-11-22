'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SignatureModal } from '@/components/reports/SignatureModal'
import { toast } from 'sonner'
import {
  FileSignature,
  Download,
  Lock,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Sparkles,
  ExternalLink,
  Save,
  Check,
  Clock,
  Printer
} from 'lucide-react'

export default function ReportDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const reportId = ((params?.reportId as string) || searchParams?.get('id') || searchParams?.get('reportId') || 'demo')

  const [isSignModalOpen, setIsSignModalOpen] = useState(false)
  const [executiveSummary, setExecutiveSummary] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)

  // Fetch Report
  const { data: report, refetch: refetchReport, isLoading } = useQuery({
    queryKey: ['report', reportId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/reports/${reportId}`)
      return res.data
    },
  })

  // Set local state when report loads
  useEffect(() => {
    if (report) {
      setExecutiveSummary(report.executive_summary || report.content?.executive_summary || '')
    }
  }, [report])

  const isFinalOrSigned = report?.status === 'finalized' || report?.status === 'signed'

  const handleSaveDraft = async () => {
    setIsSaving(true)
    try {
      await apiClient.put(`/api/reports/${reportId}`, {
        executive_summary: executiveSummary,
      })
      toast.success('Report draft updated')
      refetchReport()
    } catch (err: any) {
      toast.error('Failed to save draft')
    } finally {
      setIsSaving(false)
    }
  }

  const handleFinalize = async () => {
    setIsFinalizing(true)
    try {
      await apiClient.post(`/api/reports/${reportId}/finalize`)
      toast.success('Report successfully finalized and checksum calculated!')
      refetchReport()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to finalize report')
    } finally {
      setIsFinalizing(false)
    }
  }

  const handleDownloadPdf = async () => {
    try {
      toast.info('Downloading official compiled PDF...')
      const response = await apiClient.get(`/api/reports/${reportId}/pdf`, {
        responseType: 'blob',
      })
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Audit_Report_${reportId.slice(0, 8)}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('PDF download started')
    } catch (err: any) {
      toast.error('Could not download PDF')
    }
  }

  if (isLoading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading audit report...</div>
  }

  if (!report) {
    return <div className="p-12 text-center text-xs text-rose-500">Report not found.</div>
  }

  const signatures = report.digital_signatures || []
  const latestSig = signatures[signatures.length - 1]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Action Header */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              {report.title || 'Official ISO Audit Report'}
            </h1>
            <Badge variant="outline" className="font-mono text-xs">
              v{report.current_version || 1}
            </Badge>
            <Badge
              variant={
                report.status === 'signed'
                  ? 'default'
                  : report.status === 'finalized'
                  ? 'secondary'
                  : 'outline'
              }
              className="capitalize text-xs"
            >
              {report.status}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 font-mono">
            Report ID: {reportId}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Download PDF button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            className="text-xs gap-1.5 border-slate-300"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            PDF Report
          </Button>

          {/* Action based on status */}
          {report.status === 'draft' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="text-xs gap-1"
              >
                <Save className="w-3.5 h-3.5" /> Save Draft
              </Button>
              <Button
                size="sm"
                onClick={handleFinalize}
                disabled={isFinalizing}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1"
              >
                <Lock className="w-3.5 h-3.5" /> Finalize
              </Button>
            </>
          )}

          {report.status === 'finalized' && (
            <Button
              size="sm"
              onClick={() => setIsSignModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shadow-sm"
            >
              <FileSignature className="w-4 h-4" /> Apply Digital Signature
            </Button>
          )}

          {report.status === 'signed' && (
            <Link href={`/verify/${reportId}`} target="_blank">
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5 border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Verify Certificate <ExternalLink className="w-3 h-3 ml-0.5" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Cryptographic Seal Banner if Signed */}
      {report.status === 'signed' && latestSig && (
        <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-xs text-emerald-950">
                Cryptographically Signed & Tamper-Evident
              </h4>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Signed by <strong>{latestSig.signer_name}</strong> ({latestSig.signer_role}) on{' '}
                {new Date(latestSig.signed_at || latestSig.created_at).toLocaleString()}
              </p>
              <div className="mt-1 font-mono text-[10px] text-emerald-700 break-all">
                SHA-256 Digest: {latestSig.report_sha256}
              </div>
            </div>
          </div>
          <Link href={`/verify/${reportId}`}>
            <Badge variant="outline" className="text-[10px] bg-white border-emerald-300 text-emerald-800 cursor-pointer">
              Public Proof
            </Badge>
          </Link>
        </div>
      )}

      {/* Main Report Document Sheet */}
      <Card className="border-slate-200 shadow-md bg-white">
        <CardContent className="p-8 sm:p-12 space-y-8 text-slate-800">
          {/* Document Header */}
          <div className="border-b border-slate-200 pb-6 flex items-start justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600 mb-1">
                Official Compliance Statement
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                {report.title || 'ISO Standards Conformance Report'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Standard Assessment: ISO/IEC 17025 • Generated by Auditor AI Twin
              </p>
            </div>
            <div className="text-right text-xs text-slate-500 font-mono">
              <div>Date: {new Date(report.created_at).toLocaleDateString()}</div>
              <div>Version: {report.current_version || 1}.0</div>
            </div>
          </div>

          {/* Section 1: Executive Summary */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" /> 1. Executive Summary
            </h3>
            {isFinalOrSigned ? (
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                {executiveSummary || 'No summary text available.'}
              </div>
            ) : (
              <textarea
                value={executiveSummary}
                onChange={(e) => setExecutiveSummary(e.target.value)}
                rows={5}
                className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600 leading-relaxed"
                placeholder="Enter executive summary or observations..."
              />
            )}
          </div>

          {/* Section 2: Audit Scope */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" /> 2. Scope of Evaluation
            </h3>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed">
              This audit evaluates the laboratory management system, competence of personnel, calibration records, and procedural adherence against statutory requirements defined in ISO/IEC 17025:2017.
            </div>
          </div>

          {/* Section 3: Summary of Findings */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> 3. Findings Summary
            </h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[10px] uppercase">
                  <tr>
                    <th className="px-4 py-2.5">Clause</th>
                    <th className="px-4 py-2.5">Assessment</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-mono font-semibold text-blue-600">4.1</td>
                    <td className="px-4 py-2.5">Impartiality Safeguards & Risk Identification</td>
                    <td className="px-4 py-2.5">
                      <span className="text-emerald-700 font-semibold">Compliant</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-mono font-semibold text-blue-600">4.2</td>
                    <td className="px-4 py-2.5">Confidentiality of Customer Proprietary Data</td>
                    <td className="px-4 py-2.5">
                      <span className="text-emerald-700 font-semibold">Compliant</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-mono font-semibold text-blue-600">6.2</td>
                    <td className="px-4 py-2.5">Personnel Competence & Training Records</td>
                    <td className="px-4 py-2.5">
                      <span className="text-amber-700 font-semibold">Partially Compliant</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Signatures Section */}
          <div className="border-t border-slate-200 pt-8 mt-12">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
              4. Authorizing Digital Signatures
            </h3>

            {latestSig ? (
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-slate-900">{latestSig.signer_name}</div>
                  <div className="text-slate-600">{latestSig.signer_role}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Signed: {new Date(latestSig.signed_at || latestSig.created_at).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate max-w-sm">
                    Digest: {latestSig.report_sha256}
                  </div>
                </div>

                {latestSig.signature_storage_path && (
                  <div className="border border-slate-300 rounded bg-white p-2">
                    <img
                      src={latestSig.signature_storage_path}
                      alt="Digital Signature"
                      className="max-h-16 max-w-[180px] object-contain"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center text-xs text-slate-400">
                Pending auditor signature and final release authorization.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Signature Modal */}
      <SignatureModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        reportId={reportId}
        onSigned={() => {
          refetchReport()
        }}
      />
    </div>
  )
}
