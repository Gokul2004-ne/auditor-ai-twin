'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getBasePath } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.href = `${getBasePath()}/login/`
  }

  // Derive user role: 'auditee' vs 'auditor'
  const role: 'auditor' | 'auditee' =
    user?.user_metadata?.role === 'auditee' ||
    user?.email?.toLowerCase().includes('auditee')
      ? 'auditee'
      : 'auditor'

  return { user, role, loading, signOut }
}
