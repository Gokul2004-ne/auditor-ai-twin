import { Suspense } from 'react'
import ReportClient from './ReportClient'

export function generateStaticParams() {
  return [{ reportId: 'demo' }]
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading report...</div>}>
      <ReportClient />
    </Suspense>
  )
}
