'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import {
  FileCheck2,
  Upload,
  CheckCircle2,
  Loader2,
  FileText,
  Sparkles,
  ArrowRight,
  Database,
  ShieldCheck,
  FileCode
} from 'lucide-react'

const STANDARDS = [
  { id: 'ISO17025:2017', code: 'ISO/IEC 17025', version: '2017', title: 'Testing & Calibration Laboratories' },
  { id: 'ISO12207:2017', code: 'ISO/IEC/IEEE 12207', version: '2017', title: 'Software Lifecycle Processes' },
  { id: 'ISO15504:2004', code: 'ISO/IEC 15504', version: '2004', title: 'Process Assessment (SPICE)' },
]

export default function NewAuditPage() {
  const router = useRouter()
  const [step, setStep] = useState<number>(1)
  const [name, setName] = useState('ISO 17025 Lab Quality System Audit')
  const [selectedStandard, setSelectedStandard] = useState(STANDARDS[0])
  const [selectedClauseIds, setSelectedClauseIds] = useState<string[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [progressStatus, setProgressStatus] = useState('')
  const [progressPct, setProgressPct] = useState(0)

  // Fetch clauses for selected standard
  const { data: clauses = [], isLoading: clausesLoading } = useQuery({
    queryKey: ['clauses', selectedStandard.id],
    queryFn: async () => {
      const res = await apiClient.get(`/api/standards/${encodeURIComponent(selectedStandard.id)}/clauses`)
      return res.data
    },
  })

  // Select all clauses by default when clauses load
  useEffect(() => {
    if (clauses.length > 0) {
      setSelectedClauseIds(clauses.map((c: any) => c.id))
    }
  }, [clauses])

  const toggleClause = (id: string) => {
    setSelectedClauseIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const selectAll = () => setSelectedClauseIds(clauses.map((c: any) => c.id))
  const selectNone = () => setSelectedClauseIds([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  // Quick helper to generate a sample laboratory PDF in-browser if user doesn't have one handy
  const generateSampleLabPdf = () => {
    // Create a plain text blob and rename to .txt or mock pdf
    const sampleContent = `%PDF-1.4
% Sample ISO/IEC 17025 Laboratory Quality Manual
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 380 >> stream
BT
/F1 12 Tf
70 700 Td
(Section 4.1 Impartiality: The laboratory undertakes testing impartially and structured to safeguard impartiality.) Tj
0 -24 Td
(Section 4.2 Confidentiality: The laboratory is responsible for the management of all information obtained or created.) Tj
0 -24 Td
(Section 5.0 Structural Requirements: The laboratory is a legal entity with defined leadership and technical management.) Tj
0 -24 Td
(Section 6.2 Personnel: All personnel are competent and work in accordance with the management system.) Tj
0 -24 Td
(Section 6.4 Equipment: Equipment used is calibrated and maintained to meet accuracy specifications.) Tj
ET
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f
0000000010 00000 n
0000000060 00000 n
0000000117 00000 n
0000000228 00000 n
0000000660 00000 n
trailer << /Size 6 /Root 1 0 R >>
startxref
737
%%EOF`
    const blob = new Blob([sampleContent], { type: 'application/pdf' })
    const sampleFile = new File([blob], 'Quality_Manual_ISO17025_Lab.pdf', { type: 'application/pdf' })
    setFile(sampleFile)
    toast.success('Generated and attached sample ISO 17025 Quality Manual PDF!')
  }

  const handleStartAudit = async () => {
    if (!name.trim()) {
      toast.error('Please enter an audit name')
      return
    }
    if (selectedClauseIds.length === 0) {
      toast.error('Please select at least one clause to audit')
      return
    }
    if (!file) {
      toast.error('Please attach or generate an evidence document')
      return
    }

    setIsSubmitting(true)
    setProgressPct(10)
    setProgressStatus('Creating audit record...')

    try {
      // 1. Create audit
      const auditRes = await apiClient.post('/api/audits', {
        name,
        standard_code: selectedStandard.code,
        standard_version: selectedStandard.version,
      })
      const auditId = auditRes.data.id
      setProgressPct(25)
      setProgressStatus('Adding selected clauses to audit scope...')

      // 2. Associate clauses
      const clausePayload = selectedClauseIds.map((cid) => ({
        clause_id: cid,
        standard_code: selectedStandard.code,
        standard_version: selectedStandard.version,
      }))
      await apiClient.post(`/api/audits/${auditId}/clauses`, clausePayload)
      setProgressPct(40)
      setProgressStatus('Uploading evidence document to Supabase storage...')

      // 3. Upload document
      const formData = new FormData()
      formData.append('file', file)
      formData.append('audit_id', auditId)

      const docRes = await apiClient.post('/api/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const docId = docRes.data.id || docRes.data.document_id
      setProgressPct(60)
      setProgressStatus('Extracting text (PyMuPDF) & embedding into Qdrant vector database...')

      // 4. Document is already indexed during upload; verify or fallback
      if (docId) {
        try {
          await apiClient.post(`/api/documents/${docId}/process`)
        } catch (e) {
          // Document was already indexed during upload
          console.info('Document indexed')
        }
      }
      setProgressPct(80)
      setProgressStatus('Running autonomous AI twin audit with Gemini 2.5 Flash...')

      // 5. Trigger autonomous audit run
      await apiClient.post(`/api/audits/${auditId}/run`)
      setProgressPct(100)
      setProgressStatus('Audit completed! Redirecting to review dashboard...')

      toast.success('Audit successfully executed against evidence!')
      router.push(`/audits/review/?id=${auditId}`)
    } catch (err: any) {
      console.error('Audit execution error:', err)
      toast.error(err.response?.data?.detail || err.message || 'Audit execution failed')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Initiate New ISO Audit</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure audit scope, select standard clauses, upload evidence, and execute Gemini assessment.
        </p>
      </div>

      {isSubmitting ? (
        <Card className="border-blue-200 bg-blue-50/40 p-8 text-center space-y-6 shadow-sm">
          <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 animate-pulse">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-900">
              Autonomous Auditor Twin at Work
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">{progressStatus}</p>
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <Progress value={progressPct} className="h-2" />
            <div className="flex justify-between text-[11px] font-mono text-slate-500">
              <span>Progress</span>
              <span>{progressPct}%</span>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Step 1: Audit Details & Standard */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] flex items-center justify-center font-bold">1</span>
                Engagement Details & Target Standard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="audit-name" className="text-xs font-medium text-slate-700">
                  Audit Engagement Title
                </Label>
                <Input
                  id="audit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Annual Accreditation Audit - ISO 17025"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">Select ISO Standard</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {STANDARDS.map((std) => {
                    const isSelected = selectedStandard.id === std.id
                    return (
                      <div
                        key={std.id}
                        onClick={() => setSelectedStandard(std)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-500'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-slate-900">{std.code}</span>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {std.version}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{std.title}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Clause Scope Selection */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] flex items-center justify-center font-bold">2</span>
                  Scope & Clauses ({selectedClauseIds.length} of {clauses.length} selected)
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Select which standard clauses will be audited by the twin
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={selectAll} className="h-7 text-xs">
                  Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={selectNone} className="h-7 text-xs text-slate-500">
                  Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {clausesLoading ? (
                <div className="p-6 text-center text-xs text-slate-400">Loading clauses from graph...</div>
              ) : (
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg p-2 bg-slate-50/50">
                  {clauses.map((c: any) => {
                    const isChecked = selectedClauseIds.includes(c.id)
                    return (
                      <div
                        key={c.id}
                        onClick={() => toggleClause(c.id)}
                        className="py-2 px-3 hover:bg-white rounded flex items-center gap-3 cursor-pointer transition-colors"
                      >
                        <Checkbox checked={isChecked} onCheckedChange={() => toggleClause(c.id)} />
                        <span className="font-mono text-xs font-semibold text-blue-600 w-12 shrink-0">
                          {c.number}
                        </span>
                        <span className="text-xs text-slate-800 font-medium truncate flex-1">
                          {c.title}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 3: Evidence Document */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] flex items-center justify-center font-bold">3</span>
                Upload Evidence Document (PDF)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Quality manual, SOP, software management plan, or calibration certificate to audit
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <div className="text-xs font-medium text-slate-700">
                  {file ? file.name : 'Upload PDF evidence file'}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supports PDF files up to 50MB. Text will be vectorized and mapped to ISO clauses.
                </p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <label className="cursor-pointer">
                    <Button variant="outline" size="sm" type="button" className="text-xs pointer-events-none">
                      Browse Files
                    </Button>
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={generateSampleLabPdf}
                    className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <FileCode className="w-3.5 h-3.5 mr-1" /> Use Sample 17025 Manual
                  </Button>
                </div>
              </div>

              {file && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800">
                  <div className="flex items-center gap-2 truncate">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-medium truncate">{file.name}</span>
                    <span className="text-[10px] text-emerald-600">({Math.round(file.size / 1024)} KB)</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFile(null)}
                    className="h-6 text-[11px] text-emerald-700 hover:text-rose-600"
                  >
                    Remove
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Button */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleStartAudit}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-6 py-2.5 h-auto gap-2 shadow-md"
            >
              <Sparkles className="w-4 h-4" /> Execute Autonomous Audit
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
