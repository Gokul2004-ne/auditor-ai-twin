'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Loader2 } from 'lucide-react'

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/login')
  }, [router])

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-300 p-4">
      <div className="inline-flex h-12 w-12 rounded-xl bg-blue-600 items-center justify-center text-white shadow-lg shadow-blue-500/20 mb-4 animate-pulse">
        <ShieldCheck className="w-7 h-7" />
      </div>
      <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
        <span>Entering Auditor AI Twin Workspace...</span>
      </div>
    </div>
  )
}
