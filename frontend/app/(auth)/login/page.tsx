'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isSignUp, setIsSignUp] = useState(false)
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
              role: 'auditor',
            },
          },
        })
        if (error) throw error
        toast.success('Registration successful! Redirecting...')
        window.location.href = '/dashboard'
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        toast.success('Welcome back, Lead Auditor')
        window.location.href = '/dashboard'
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemoCredentials = () => {
    setEmail('auditor@isotwin.internal')
    setPassword('AuditorPass123!')
    setFullName('Lead ISO Auditor')
    toast.info('Demo auditor credentials populated')
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {isSignUp ? 'Create Auditor Profile' : 'Auditor Sign In'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isSignUp ? 'Register to start compliance auditing' : 'Access your audit twin workspace'}
          </p>
        </div>
        <button
          type="button"
          onClick={fillDemoCredentials}
          className="text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded border border-blue-200 flex items-center gap-1 transition-colors"
        >
          <Sparkles className="w-3 h-3 text-blue-500" />
          Fill Demo
        </button>
      </div>

      <form onSubmit={handleAuth} className="space-y-4">
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
            placeholder="auditor@organization.com"
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
              <span className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer">
                Forgot password?
              </span>
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
          disabled={loading}
          className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm mt-2 transition-colors"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <ArrowRight className="w-4 h-4 mr-2" />
          )}
          {isSignUp ? 'Create Account' : 'Sign In'}
        </Button>
      </form>

      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>{isSignUp ? 'Already have an account?' : "Don't have an auditor account?"}</span>
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="font-semibold text-blue-600 hover:underline"
        >
          {isSignUp ? 'Sign In instead' : 'Register now'}
        </button>
      </div>
    </div>
  )
}
