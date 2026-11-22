import { Suspense } from 'react'
import AuditReviewClient from './AuditReviewClient'

export function generateStaticParams() {
  return [{ auditId: 'demo' }]
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading audit review...</div>}>
      <AuditReviewClient />
    </Suspense>
  )
}
