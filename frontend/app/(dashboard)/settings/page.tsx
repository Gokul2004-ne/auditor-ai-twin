'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  Settings,
  Database,
  Network,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Server,
  Save
} from 'lucide-react'

export default function SettingsPage() {
  const [orgName, setOrgName] = useState('Acme Analytical Laboratories')
  const [threshold, setThreshold] = useState('0.65')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      toast.success('System settings updated successfully')
    }, 600)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">System & Organization Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your audit organization profile, AI twin sensitivity thresholds, and backend integrations.
        </p>
      </div>

      {/* Organization Details */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-600" /> Organization Profile
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Multi-tenant organization boundary and audit authority identifier
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="org-name" className="text-xs font-medium text-slate-700">
                Organization Legal Name
              </Label>
              <Input
                id="org-name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">
                Auditor Role Designation
              </Label>
              <Input
                value="Lead ISO 17025 Assessor"
                disabled
                className="h-9 text-xs bg-slate-50 text-slate-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connected AI & Graph Engines */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-600" /> Infrastructure & Engine Diagnostics
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Real-time status of connected compliance graph and vector indexes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                N4J
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900">Neo4j Aura Knowledge Graph</div>
                <div className="text-[11px] text-slate-500 font-mono">neo4j+ssc://30b20a56.databases.neo4j.io</div>
              </div>
            </div>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Connected (52 Clauses)
            </Badge>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                QDR
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900">Qdrant Cloud Vector Store</div>
                <div className="text-[11px] text-slate-500 font-mono">Collection: audit_documents (384 dims)</div>
              </div>
            </div>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Connected
            </Badge>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                GEM
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900">Gemini 2.5 Flash Reasoning Engine</div>
                <div className="text-[11px] text-slate-500">Autonomous evidence assessment & report synthesis</div>
              </div>
            </div>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Active
            </Badge>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                SUP
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900">Supabase Database & Storage</div>
                <div className="text-[11px] text-slate-500">PostgreSQL with RLS & S3-compatible file storage</div>
              </div>
            </div>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Active
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* AI Sensitivity & Thresholds */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" /> Auditor AI Twin Configuration
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Tune algorithmic parameters for evidence retrieval and non-conformity detection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="threshold" className="text-xs font-medium text-slate-700">
              Minimum Evidence Vector Similarity Threshold
            </Label>
            <Input
              id="threshold"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="h-9 text-xs w-48 font-mono"
            />
            <p className="text-[11px] text-slate-400">
              Cosine similarity threshold between ISO clause requirements and document chunks (default: 0.65).
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
