import { Suspense } from 'react'
import AuditReviewClient from '../[auditId]/AuditReviewClient'

export default function AuditReviewPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading audit review...</div>}>
      <AuditReviewClient />
    </Suspense>
  )
}
