'use client'

import React, { useState } from 'react'
import { ChevronRight, ChevronDown, BookOpen, Layers } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ClauseTreeProps {
  clauses: any[]
  selectedClauseId: string | null
  onSelectClause: (clauseId: string) => void
}

export function ClauseTree({ clauses, selectedClauseId, onSelectClause }: ClauseTreeProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    '4': true,
    '5': true,
    '6': true,
    '7': true,
    '8': true,
  })

  const toggleSection = (sectionNumber: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionNumber]: !prev[sectionNumber],
    }))
  }

  // Group clauses by top-level section number (e.g., '4', '5', '6', etc.)
  const groupedClauses: Record<string, any[]> = {}
  clauses.forEach((c) => {
    const topLevel = c.number ? c.number.split('.')[0] : 'Other'
    if (!groupedClauses[topLevel]) groupedClauses[topLevel] = []
    groupedClauses[topLevel].push(c)
  })

  // Sort top-level keys
  const sortedSections = Object.keys(groupedClauses).sort((a, b) => {
    const numA = parseInt(a, 10) || 999
    const numB = parseInt(b, 10) || 999
    return numA - numB
  })

  return (
    <div className="space-y-1 text-xs select-none">
      {sortedSections.map((section) => {
        const isExpanded = !!expandedSections[section]
        const sectionClauses = groupedClauses[section]
        const sectionTitle = sectionClauses[0]?.title || `Section ${section}`

        return (
          <div key={section} className="rounded border border-slate-200/60 overflow-hidden bg-white">
            <button
              onClick={() => toggleSection(section)}
              className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold transition-colors text-left"
            >
              <div className="flex items-center gap-2 truncate">
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
                <span className="font-mono text-blue-600 font-bold shrink-0">{section}</span>
                <span className="truncate text-[11px] text-slate-700">{sectionTitle}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-normal ml-2 shrink-0">
                {sectionClauses.length}
              </span>
            </button>

            {isExpanded && (
              <div className="divide-y divide-slate-100 bg-white">
                {sectionClauses.map((clause) => {
                  const isSelected = selectedClauseId === clause.id
                  return (
                    <button
                      key={clause.id}
                      onClick={() => onSelectClause(clause.id)}
                      className={`w-full flex items-start gap-2 px-3 py-2 text-left transition-colors ${
                        isSelected
                          ? 'bg-blue-50 text-blue-900 border-l-3 border-blue-600 font-medium'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="font-mono text-[11px] font-semibold text-slate-500 shrink-0 mt-0.5">
                        {clause.number}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[11px] font-medium text-slate-800">
                          {clause.title}
                        </div>
                        {clause.summary && (
                          <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                            {clause.summary}
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
