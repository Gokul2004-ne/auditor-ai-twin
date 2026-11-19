'use client'

import React, { useMemo } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ClauseGraphProps {
  graphData: {
    nodes: any[]
    links: any[]
  } | null
  selectedClauseId: string
  onNodeClick?: (nodeId: string) => void
}

export function ClauseGraph({ graphData, selectedClauseId, onNodeClick }: ClauseGraphProps) {
  const { nodes, edges } = useMemo(() => {
    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
      return { nodes: [], edges: [] }
    }

    const rawNodes = graphData.nodes
    const rawLinks = graphData.links || []

    // Arrange nodes around the center
    // Center node is the selectedClauseId
    const centerNode = rawNodes.find((n) => n.id === selectedClauseId) || rawNodes[0]
    const otherNodes = rawNodes.filter((n) => n.id !== centerNode?.id)

    const calculatedNodes: Node[] = []
    const centerX = 380
    const centerY = 240

    if (centerNode) {
      calculatedNodes.push({
        id: centerNode.id,
        position: { x: centerX, y: centerY },
        data: {
          label: (
            <div className="p-3 bg-blue-600 text-white rounded-lg shadow-md border-2 border-blue-400 max-w-[200px]">
              <div className="text-[10px] font-mono opacity-80 uppercase tracking-wider">
                {centerNode.type || 'Clause'}
              </div>
              <div className="font-bold text-xs truncate mt-0.5">
                {centerNode.number ? `${centerNode.number} ` : ''}
                {centerNode.title || centerNode.name || centerNode.id}
              </div>
            </div>
          ),
        },
        type: 'default',
        style: { background: 'transparent', border: 'none', padding: 0 },
      })
    }

    // Place remaining nodes in a circle or categorized offsets
    const radius = 220
    const totalOthers = otherNodes.length
    const angleStep = (2 * Math.PI) / Math.max(totalOthers, 1)

    otherNodes.forEach((node, index) => {
      const angle = index * angleStep
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius

      let nodeColor = 'bg-slate-800 text-white'
      let borderColor = 'border-slate-700'
      const nodeType = node.type || (node.id.includes('Evidence') ? 'EvidenceType' : 'Related')

      if (nodeType === 'EvidenceType' || node.label === 'EvidenceType') {
        nodeColor = 'bg-amber-500 text-amber-950 font-semibold'
        borderColor = 'border-amber-400'
      } else if (nodeType === 'AuditQuestion' || node.label === 'AuditQuestion') {
        nodeColor = 'bg-purple-600 text-white'
        borderColor = 'border-purple-400'
      } else if (node.standard_code && node.standard_code !== 'ISO17025') {
        nodeColor = 'bg-emerald-600 text-white'
        borderColor = 'border-emerald-400'
      }

      calculatedNodes.push({
        id: node.id,
        position: { x, y },
        data: {
          label: (
            <div
              className={`p-2.5 rounded-lg shadow-sm border ${nodeColor} ${borderColor} max-w-[180px] cursor-pointer hover:scale-105 transition-transform`}
              onClick={() => onNodeClick && onNodeClick(node.id)}
            >
              <div className="text-[9px] font-mono opacity-80 uppercase tracking-wider">
                {nodeType}
              </div>
              <div className="font-medium text-[11px] truncate mt-0.5">
                {node.number ? `${node.number} ` : ''}
                {node.title || node.name || node.question || node.id}
              </div>
            </div>
          ),
        },
        style: { background: 'transparent', border: 'none', padding: 0 },
      })
    })

    const calculatedEdges: Edge[] = rawLinks.map((link, idx) => ({
      id: `edge-${idx}-${link.source}-${link.target}`,
      source: typeof link.source === 'object' ? link.source.id : link.source,
      target: typeof link.target === 'object' ? link.target.id : link.target,
      label: link.type || 'RELATED_TO',
      labelStyle: { fill: '#64748b', fontSize: 10, fontFamily: 'monospace' },
      labelBgStyle: { fill: '#ffffff', fillOpacity: 0.9 },
      labelBgPadding: [4, 2] as [number, number],
      style: { stroke: '#94a3b8', strokeWidth: 1.5 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#94a3b8',
      },
    }))

    return { nodes: calculatedNodes, edges: calculatedEdges }
  }, [graphData, selectedClauseId, onNodeClick])

  return (
    <div className="w-full h-full min-h-[480px] bg-slate-900 rounded-xl relative overflow-hidden border border-slate-800">
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <Badge variant="outline" className="bg-slate-950/80 text-slate-300 border-slate-700 font-mono text-[10px]">
          Neo4j Graph Visualizer
        </Badge>
        <span className="text-[10px] text-slate-400 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
          {nodes.length} Nodes • {edges.length} Relationships
        </span>
      </div>

      <div className="absolute bottom-3 right-3 z-10 hidden sm:flex items-center gap-2 text-[10px] font-mono bg-slate-950/80 p-2 rounded border border-slate-800 text-slate-300">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded bg-blue-600"></span> Active Clause
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded bg-amber-500"></span> Evidence
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded bg-purple-600"></span> Question
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded bg-emerald-600"></span> Cross-Standard
        </span>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        attributionPosition="bottom-left"
        className="bg-slate-950"
      >
        <Background color="#334155" gap={16} />
        <Controls className="bg-slate-800 border-slate-700 text-slate-200 fill-slate-200" />
      </ReactFlow>
    </div>
  )
}
