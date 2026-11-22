'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, ArrowRight, ShieldCheck, Sparkles, UserCheck, Building2 } from 'lucide-react'
import { getBasePath } from '@/lib/utils'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isSignUp, setIsSignUp] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'auditor' | 'auditee'>('auditor')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: selectedRole,
            },
          },
        })
        if (error) throw error
        toast.success(`Registration successful! Redirecting to ${selectedRole === 'auditee' ? 'Audity' : 'Auditor'} Portal...`)
        const dest = selectedRole === 'auditee' ? '/auditee/dashboard/' : '/dashboard/'
        window.location.href = `${getBasePath()}${dest}`
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error

        const userRole =
          data.user?.user_metadata?.role ||
          (data.user?.email?.toLowerCase().includes('auditee') ? 'auditee' : 'auditor')

        toast.success(`Welcome back, ${userRole === 'auditee' ? 'Quality Representative' : 'Lead Auditor'}`)
        const dest = userRole === 'auditee' ? '/auditee/dashboard/' : '/dashboard/'
        window.location.href = `${getBasePath()}${dest}`
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const fillAuditorCredentials = () => {
    setEmail('auditor@isotwin.internal')
    setPassword('AuditorPass123!')
    setFullName('Lead ISO Auditor')
    setSelectedRole('auditor')
    toast.info('Lead Auditor credentials populated')
  }

  const fillAuditeeCredentials = () => {
    setEmail('auditee@isotwin.internal')
    setPassword('AuditeePass123!')
    setFullName('Quality Lab Auditee')
    setSelectedRole('auditee')
    toast.info('Audity client credentials populated')
  }

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {isSignUp ? 'Create Workspace Account' : 'Sign In'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isSignUp ? 'Select role to access your compliance workspace' : 'Access Auditor or Audity twin workspace'}
          </p>
        </div>

        {/* Demo Fill Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={fillAuditorCredentials}
            className="text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded border border-blue-200 flex items-center gap-1 transition-colors"
          >
            <ShieldCheck className="w-3 h-3 text-blue-600" />
            Auditor Demo
          </button>
          <button
            type="button"
            onClick={fillAuditeeCredentials}
            className="text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded border border-emerald-200 flex items-center gap-1 transition-colors"
          >
            <Building2 className="w-3 h-3 text-emerald-600" />
            Audity Demo
          </button>
        </div>
      </div>

      <form onSubmit={handleAuth} className="space-y-4">
        {/* Role Picker during Sign Up */}
        {isSignUp && (
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700">Account Role</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedRole('auditor')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                  selectedRole === 'auditor'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-800 shadow-xs ring-1 ring-blue-500'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                Auditor
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('auditee')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                  selectedRole === 'auditee'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-800 shadow-xs ring-1 ring-emerald-500'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                Audity (Client)
              </button>
            </div>
          </div>
        )}

        {isSignUp && (
          <div className="space-y-1.5">
            <Label htmlFor="fullName" className="text-xs font-medium text-slate-700">
              Full Name
            </Label>
            <Input
              id="fullName"
              placeholder="e.g. Dr. Jane Smith"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required={isSignUp}
              className="h-10 text-sm"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-medium text-slate-700">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="auditor@isotwin.internal or auditee@isotwin.internal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-10 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-medium text-slate-700">
              Password
            </Label>
            {!isSignUp && (
              <a href="#" className="text-xs text-blue-600 hover:text-blue-700">
                Forgot password?
              </a>
            )}
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-10 text-sm"
          />
        </div>

        <Button
          type="submit"
          className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm gap-2 shadow-sm transition-all"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying credentials...</span>
            </>
          ) : (
            <>
              <span>{isSignUp ? 'Create Workspace Account' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>{isSignUp ? 'Already registered?' : "Don't have an auditor or audity account?"}</span>
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
        >
          {isSignUp ? 'Sign in instead' : 'Register now'}
        </button>
      </div>
    </div>
  )
}
