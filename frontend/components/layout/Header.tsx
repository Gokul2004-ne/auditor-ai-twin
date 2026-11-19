'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus, Database, Sparkles, Shield, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Header() {
  const pathname = usePathname()

  const getBreadcrumb = () => {
    if (pathname.startsWith('/standards')) return 'Standards Knowledge Graph'
    if (pathname.startsWith('/audits/new')) return 'New Document Audit'
    if (pathname.startsWith('/audits')) return 'Audit Engagements'
    if (pathname.startsWith('/reports')) return 'Audit Reports & Signatures'
    if (pathname.startsWith('/settings')) return 'System Settings'
    return 'Auditor Twin Dashboard'
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Title & Context */}
      <div className="flex items-center gap-3">
        <h2 className="text-base font-semibold text-slate-800 tracking-tight">
          {getBreadcrumb()}
        </h2>
        <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3" /> System Verified
        </span>
      </div>

      {/* Engine Status & Action */}
      <div className="flex items-center gap-3">
        {/* Micro badges for engine status */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-slate-600 bg-slate-100 px-3 py-1 rounded-md border border-slate-200">
          <span className="flex items-center gap-1 text-[11px]">
            <Database className="w-3 h-3 text-blue-600" />
            Neo4j Graph
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-violet-500"></span>
            Qdrant Vector
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1 text-[11px]">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Gemini Flash
          </span>
        </div>

        {/* Global Action Button */}
        {!pathname.startsWith('/audits/new') && (
          <Link href="/audits/new">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm">
              <Plus className="w-4 h-4" />
              <span>New Audit</span>
            </Button>
          </Link>
        )}
      </div>
    </header>
  )
}
