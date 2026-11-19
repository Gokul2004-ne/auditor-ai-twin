import AuditReviewClient from './AuditReviewClient'

export function generateStaticParams() {
  return [{ auditId: 'demo' }]
}

export default function Page() {
  return <AuditReviewClient />
}
