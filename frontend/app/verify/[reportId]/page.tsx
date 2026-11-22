import { Suspense } from 'react'
import VerifyClient from './VerifyClient'

export function generateStaticParams() {
  return [{ reportId: 'demo' }]
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Verifying certificate...</div>}>
      <VerifyClient />
    </Suspense>
  )
}
