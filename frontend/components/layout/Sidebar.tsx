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
  Building2,
  LogOut,
  ChevronRight,
  UserCheck
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface NavItem {
  name: string
  href: string
  icon: any
  badge?: string
}

const AUDITOR_NAV_ITEMS: NavItem[] = [
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

const AUDITEE_NAV_ITEMS: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/auditee/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Audity Documents',
    href: '/auditee/documents',
    icon: FileCheck2,
  },
  {
    name: 'Settings',
    href: '/auditee/settings',
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, role, signOut } = useAuth()

  const isAuditeeView = pathname.startsWith('/auditee') || role === 'auditee'
  const navItems = isAuditeeView ? AUDITEE_NAV_ITEMS : AUDITOR_NAV_ITEMS

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 select-none shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800 bg-slate-950">
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center text-white shadow-md ${
          isAuditeeView
            ? 'bg-emerald-600 shadow-emerald-500/20'
            : 'bg-blue-600 shadow-blue-500/20'
        }`}>
          {isAuditeeView ? <Building2 className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
        </div>
        <div className="min-w-0">
          <h1 className="font-semibold text-sm tracking-wide text-white truncate">
            {isAuditeeView ? 'Audity Portal' : 'Auditor AI Twin'}
          </h1>
          <p className="text-[11px] text-slate-400 font-mono">
            {isAuditeeView ? 'ISO Client Workspace' : 'ISO 17025 • 12207 • 15504'}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6 px-3 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          {isAuditeeView ? 'Audity Workspace' : 'Core Operations'}
        </div>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && item.href !== '/auditee/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? isAuditeeView
                    ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive
                      ? isAuditeeView ? 'text-emerald-400' : 'text-blue-400'
                      : 'text-slate-400'
                  }`}
                />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* User profile footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase text-white ${
              isAuditeeView ? 'bg-emerald-700' : 'bg-slate-700'
            }`}>
              {user?.email?.charAt(0) || (isAuditeeView ? 'A' : 'L')}
            </div>
            <div className="truncate min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">
                {user?.user_metadata?.full_name || (isAuditeeView ? 'Quality Representative' : 'Lead Auditor')}
              </p>
              <p className="text-[10px] text-slate-500 font-mono truncate">
                {isAuditeeView ? 'Client Role (Audity)' : 'Certified ISO Lead'}
              </p>
            </div>
          </div>
          <button
            onClick={signOut}
            title="Sign out"
            className="text-slate-400 hover:text-rose-400 p-1.5 rounded-md hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
