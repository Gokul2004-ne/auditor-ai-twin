import { Suspense } from 'react'
import VerifyClient from '../[reportId]/VerifyClient'

export default function CertificateVerifyPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Verifying certificate...</div>}>
      <VerifyClient />
    </Suspense>
  )
}
