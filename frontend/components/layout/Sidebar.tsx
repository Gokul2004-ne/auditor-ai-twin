'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Network,
  FileCheck2,
  FileSignature,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronRight
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const NAV_ITEMS = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Standards Graph',
    href: '/standards',
    icon: Network,
    badge: 'Neo4j',
  },
  {
    name: 'Audit Documents',
    href: '/audits',
    icon: FileCheck2,
  },
  {
    name: 'Reports & Sign',
    href: '/reports',
    icon: FileSignature,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 select-none shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800 bg-slate-950">
        <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-semibold text-sm tracking-wide text-white">Auditor AI Twin</h1>
          <p className="text-[11px] text-slate-400 font-mono">ISO 17025 • 12207 • 15504</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6 px-3 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Core Operations
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  isActive ? 'bg-blue-700 text-blue-100' : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* System Status & User Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60">
        <div className="mb-3 px-1 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Engines Online
          </span>
          <span className="text-[10px] font-mono text-slate-500">v1.0.0</span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
          <div className="overflow-hidden pr-2">
            <p className="text-xs font-medium text-slate-200 truncate">
              {user?.email || 'Auditor Twin User'}
            </p>
            <p className="text-[10px] text-slate-400 capitalize">
              {user?.user_metadata?.role || 'Lead Auditor'}
            </p>
          </div>
          <button
            onClick={() => signOut()}
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
