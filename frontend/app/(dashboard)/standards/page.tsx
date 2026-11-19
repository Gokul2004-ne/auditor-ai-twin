'use client'

import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api/client'
import { ClauseTree } from '@/components/standards/ClauseTree'
import { ClauseGraph } from '@/components/standards/ClauseGraph'
import { ClauseDetails } from '@/components/standards/ClauseDetails'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, Network, Layers, Sparkles, Filter } from 'lucide-react'

const STANDARDS = [
  { id: 'ISO17025:2017', code: 'ISO/IEC 17025', name: 'Testing & Calibration Labs', version: '2017' },
  { id: 'ISO12207:2017', code: 'ISO/IEC/IEEE 12207', name: 'Software Lifecycle Processes', version: '2017' },
  { id: 'ISO15504:2004', code: 'ISO/IEC 15504', name: 'Process Assessment (SPICE)', version: '2004' },
]

export default function StandardsPage() {
  const [selectedStandardId, setSelectedStandardId] = useState<string>('ISO17025:2017')
  const [selectedClauseId, setSelectedClauseId] = useState<string>('ISO17025:2017:4.1')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch clauses for the active standard
  const { data: clauses = [], isLoading: clausesLoading } = useQuery({
    queryKey: ['clauses', selectedStandardId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/standards/${encodeURIComponent(selectedStandardId)}/clauses`)
      return res.data
    },
  })

  // Whenever standard changes, select its first clause if current doesn't match
  useEffect(() => {
    if (clauses.length > 0) {
      const exists = clauses.some((c: any) => c.id === selectedClauseId)
      if (!exists) {
        setSelectedClauseId(clauses[0].id)
      }
    }
  }, [clauses, selectedStandardId, selectedClauseId])

  // Fetch specific clause details
  const { data: clauseDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['clause', selectedClauseId],
    queryFn: async () => {
      if (!selectedClauseId) return null
      const res = await apiClient.get(`/api/clauses/${encodeURIComponent(selectedClauseId)}`)
      return res.data
    },
    enabled: !!selectedClauseId,
  })

  // Fetch graph for the selected clause
  const { data: graphData, isLoading: graphLoading } = useQuery({
    queryKey: ['clause-graph', selectedClauseId],
    queryFn: async () => {
      if (!selectedClauseId) return null
      const res = await apiClient.get(`/api/clauses/${encodeURIComponent(selectedClauseId)}/graph`)
      return res.data
    },
    enabled: !!selectedClauseId,
  })

  // Filter clauses by search query
  const filteredClauses = clauses.filter((c: any) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      (c.number && c.number.toLowerCase().includes(q)) ||
      (c.title && c.title.toLowerCase().includes(q)) ||
      (c.summary && c.summary.toLowerCase().includes(q))
    )
  })

  return (
    <div className="space-y-4 h-[calc(100vh-6.5rem)] flex flex-col">
      {/* Top Standard Selector & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs shrink-0">
        {/* Standard Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {STANDARDS.map((std) => {
            const isSelected = selectedStandardId === std.id
            return (
              <button
                key={std.id}
                onClick={() => setSelectedStandardId(std.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{std.code}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-200 text-slate-600'
                }`}>
                  {std.version}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div className="relative sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <Input
            placeholder="Search clause by number or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs bg-slate-50 border-slate-200"
          />
        </div>
      </div>

      {/* Main 3-Column Layout: Hierarchy | Graph | Details */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
        {/* Left: Clause Hierarchy (3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
            <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" /> Clause Hierarchy
            </span>
            <Badge variant="outline" className="text-[10px] font-mono bg-white">
              {filteredClauses.length} Clauses
            </Badge>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {clausesLoading ? (
              <div className="p-6 text-center text-xs text-slate-400">Loading clauses from Neo4j...</div>
            ) : filteredClauses.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No matching clauses found.</div>
            ) : (
              <ClauseTree
                clauses={filteredClauses}
                selectedClauseId={selectedClauseId}
                onSelectClause={(id) => setSelectedClauseId(id)}
              />
            )}
          </div>
        </div>

        {/* Center: React Flow Graph (6 cols) */}
        <div className="lg:col-span-5 bg-slate-900 rounded-xl shadow-xs overflow-hidden flex flex-col min-h-[400px]">
          <ClauseGraph
            graphData={graphData}
            selectedClauseId={selectedClauseId}
            onNodeClick={(id) => {
              if (id.startsWith('ISO')) {
                setSelectedClauseId(id)
              }
            }}
          />
        </div>

        {/* Right: Clause Inspector (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          {detailsLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Retrieving node relationships...</div>
          ) : (
            <ClauseDetails
              clause={clauseDetails}
              onSelectMappedClause={(id) => {
                if (id.startsWith('ISO12207') && selectedStandardId !== 'ISO12207:2017') {
                  setSelectedStandardId('ISO12207:2017')
                } else if (id.startsWith('ISO17025') && selectedStandardId !== 'ISO17025:2017') {
                  setSelectedStandardId('ISO17025:2017')
                } else if (id.startsWith('ISO15504') && selectedStandardId !== 'ISO15504:2004') {
                  setSelectedStandardId('ISO15504:2004')
                }
                setSelectedClauseId(id)
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
