'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, ShieldCheck, Bell, Save } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

export default function AuditeeSettingsPage() {
  const { user } = useAuth()
  const [orgName, setOrgName] = useState('Acme Analytical Laboratories Inc.')
  const [leadContact, setLeadContact] = useState(user?.user_metadata?.full_name || 'Quality Representative')
  const [emailNotifications, setEmailNotifications] = useState(true)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success('Audity client settings saved successfully!')
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Building2 className="w-5 h-5 text-emerald-600" />
          Audity Client Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your organization compliance profile, representative contact, and audit alert preferences
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-800">Organization & Facility Profile</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Details reflected on official ISO audit engagements and reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Organization Legal Name</Label>
              <Input
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Lead Quality Representative</Label>
              <Input
                value={leadContact}
                onChange={(e) => setLeadContact(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Audity Account Email</Label>
              <Input
                value={user?.email || 'auditee@isotwin.internal'}
                disabled
                className="h-9 text-xs bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-600" />
              Audit Notification Channels
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Receive live status updates when the Auditor accepts or returns findings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Send instant alert when an auditor rejects a clause and requests resubmission</span>
            </label>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shadow-xs">
            <Save className="w-3.5 h-3.5" /> Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
