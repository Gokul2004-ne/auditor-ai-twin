'use client'

import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  FileText,
  HelpCircle,
  Link2,
  Shield,
  Layers,
  ArrowRight,
  Sparkles
} from 'lucide-react'

interface ClauseDetailsProps {
  clause: any
  onSelectMappedClause?: (clauseId: string) => void
}

export function ClauseDetails({ clause, onSelectMappedClause }: ClauseDetailsProps) {
  if (!clause) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs">
        Select a clause from the hierarchy tree or click a graph node to inspect details.
      </div>
    )
  }

  const evidenceTypes = clause.evidence_types || []
  const auditQuestions = clause.audit_questions || []
  const mappedClauses = clause.mapped_clauses || []

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className="font-mono text-[10px] bg-white border-slate-300">
            {clause.standard_code || 'ISO'}
          </Badge>
          <span className="font-mono text-xs font-bold text-blue-600">
            Clause {clause.number}
          </span>
        </div>
        <h3 className="font-semibold text-sm text-slate-900 tracking-tight leading-snug">
          {clause.title}
        </h3>
        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
          {clause.summary || 'Official ISO standard clause requirement definition.'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-y-auto p-4">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4 text-xs h-8">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="evidence" className="text-xs">
              Evidence ({evidenceTypes.length})
            </TabsTrigger>
            <TabsTrigger value="questions" className="text-xs">
              Questions ({auditQuestions.length})
            </TabsTrigger>
            <TabsTrigger value="mappings" className="text-xs">
              Maps ({mappedClauses.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Overview */}
          <TabsContent value="overview" className="space-y-4 text-xs">
            <div>
              <h4 className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" /> Requirement Summary
              </h4>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 leading-relaxed">
                {clause.summary || 'No descriptive summary provided.'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded border border-slate-100 bg-slate-50">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Standard ID</span>
                <span className="font-mono font-medium text-slate-800">{clause.standard_id || 'ISO17025:2017'}</span>
              </div>
              <div className="p-2.5 rounded border border-slate-100 bg-slate-50">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Graph ID</span>
                <span className="font-mono font-medium text-slate-800 truncate block">{clause.id}</span>
              </div>
            </div>

            {clause.children && clause.children.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-500" /> Sub-Clauses ({clause.children.length})
                </h4>
                <div className="space-y-1">
                  {clause.children.map((child: any) => (
                    <div
                      key={child.id}
                      onClick={() => onSelectMappedClause && onSelectMappedClause(child.id)}
                      className="p-2 rounded border border-slate-100 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div className="truncate">
                        <span className="font-mono font-semibold text-blue-600 mr-2">{child.number}</span>
                        <span className="text-slate-700">{child.title}</span>
                      </div>
                      <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Tab 2: Evidence */}
          <TabsContent value="evidence" className="space-y-3 text-xs">
            {evidenceTypes.length === 0 ? (
              <div className="p-4 text-center text-slate-400">
                No specific evidence types defined for this clause.
              </div>
            ) : (
              evidenceTypes.map((ev: any, idx: number) => (
                <div key={idx} className="p-3 rounded-lg border border-amber-200/60 bg-amber-50/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-amber-900">{ev.name || ev.id}</span>
                    <Badge variant="outline" className="text-[9px] bg-white border-amber-300 text-amber-800">
                      Evidence Requirement
                    </Badge>
                  </div>
                  {ev.description && (
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      {ev.description}
                    </p>
                  )}
                </div>
              ))
            )}
          </TabsContent>

          {/* Tab 3: Questions */}
          <TabsContent value="questions" className="space-y-3 text-xs">
            {auditQuestions.length === 0 ? (
              <div className="p-4 text-center text-slate-400">
                No audit questions cataloged for this clause.
              </div>
            ) : (
              auditQuestions.map((q: any, idx: number) => (
                <div key={idx} className="p-3 rounded-lg border border-purple-200/60 bg-purple-50/50 space-y-1">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <p className="font-medium text-purple-950 text-xs">
                      {q.question || q.text || q.id}
                    </p>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Tab 4: Mappings */}
          <TabsContent value="mappings" className="space-y-3 text-xs">
            {mappedClauses.length === 0 ? (
              <div className="p-4 text-center text-slate-400">
                No cross-standard mappings recorded for this clause.
              </div>
            ) : (
              mappedClauses.map((mc: any, idx: number) => (
                <div
                  key={idx}
                  onClick={() => onSelectMappedClause && onSelectMappedClause(mc.id)}
                  className="p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer space-y-1 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-emerald-700 font-bold">{mc.number || mc.id}</span>
                    <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200">
                      MAPS_TO
                    </Badge>
                  </div>
                  <div className="font-medium text-slate-900 text-xs">{mc.title}</div>
                  {mc.standard_id && (
                    <div className="text-[10px] text-slate-500 font-mono">
                      Target: {mc.standard_id}
                    </div>
                  )}
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
