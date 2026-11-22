import { Suspense } from 'react'
import ReportClient from '../[reportId]/ReportClient'

export default function ReportViewPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading report...</div>}>
      <ReportClient />
    </Suspense>
  )
}
