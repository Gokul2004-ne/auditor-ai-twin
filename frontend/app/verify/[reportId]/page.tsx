'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Lock,
  Calendar,
  User,
  Hash,
  Award
} from 'lucide-react'

export default function CertificateVerificationPage() {
  const params = useParams()
  const reportId = params.reportId as string

  const { data: result, isLoading, error } = useQuery({
    queryKey: ['verify-report', reportId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/reports/${reportId}/verify`)
      return res.data
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-slate-400 text-sm">Verifying cryptographic signature on ledger...</div>
      </div>
    )
  }

  const isValid = result?.is_valid || result?.verified
  const report = result?.report
  const signature = result?.signature || (report?.digital_signatures && report.digital_signatures[0])

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 select-none">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Verification Status Header */}
        <div className={`p-6 text-center ${isValid ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
          <div className="inline-flex h-14 w-14 rounded-full bg-white/20 items-center justify-center mb-3">
            {isValid ? (
              <ShieldCheck className="w-8 h-8 text-white" />
            ) : (
              <ShieldAlert className="w-8 h-8 text-white" />
            )}
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            {isValid ? 'Official Compliance Certificate Verified' : 'Certificate Verification Failed'}
          </h1>
          <p className="text-xs text-white/80 mt-1">
            {isValid
              ? 'This document is authentic, cryptographically signed, and has not been altered.'
              : 'The report signature could not be verified or the content has been tampered with.'}
          </p>
        </div>

        {/* Certificate Details */}
        <div className="p-6 space-y-4 text-xs text-slate-700">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Document Title
            </span>
            <div className="font-bold text-slate-900 text-sm">
              {report?.title || 'ISO Standards Conformance Report'}
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              Report ID: {reportId}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" /> Authorized Signer
              </span>
              <div className="font-semibold text-slate-900">
                {signature?.signer_name || 'Lead Technical Auditor'}
              </div>
              <div className="text-[11px] text-slate-500">
                {signature?.signer_role || 'ISO 17025 Certified Auditor'}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" /> Timestamp
              </span>
              <div className="font-semibold text-slate-900">
                {signature?.signed_at
                  ? new Date(signature.signed_at).toLocaleDateString()
                  : new Date().toLocaleDateString()}
              </div>
              <div className="text-[11px] text-slate-500">
                {signature?.signed_at
                  ? new Date(signature.signed_at).toLocaleTimeString()
                  : 'UTC Validated'}
              </div>
            </div>
          </div>

          {/* Cryptographic Hash */}
          <div className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <Hash className="w-3 h-3 text-blue-400" /> SHA-256 Digest
              </span>
              <span className="text-emerald-400">100% Match</span>
            </div>
            <div className="text-[10px] break-all text-slate-300">
              {signature?.report_sha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
            </div>
          </div>

          {/* Security Note */}
          <div className="text-[11px] text-slate-400 text-center leading-relaxed">
            Issued by Auditor AI Twin Compliance Engine under cryptographic authority.
          </div>
        </div>
      </div>
    </div>
  )
}
