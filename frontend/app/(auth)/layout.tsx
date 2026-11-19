import React from 'react'
import { ShieldCheck } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex h-12 w-12 rounded-xl bg-blue-600 items-center justify-center text-white shadow-lg shadow-blue-500/20 mb-3">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Auditor AI Twin
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          ISO Compliance & Intelligent Autonomous Audit Suite
        </p>
      </div>

      <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
        {children}
      </div>

      <div className="mt-8 text-center text-xs text-slate-500 font-mono">
        ISO/IEC 17025 • ISO/IEC/IEEE 12207 • ISO/IEC 15504
      </div>
    </div>
  )
}
