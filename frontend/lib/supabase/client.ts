import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dkpcclyyuqzseqqmfqvh.supabase.co'
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrcGNjbHl5dXF6c2VxcW1mcXZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUxMDM4OTQsImV4cCI6MjExMDY3OTg5NH0.LZLNww63gbnfupuYdaBwC71wSBQ-Lf6hqhYVu39p7cE'

  if (typeof window !== 'undefined') {
    if (!client) {
      client = createBrowserClient(url, anonKey)
    }
    return client
  }

  return createBrowserClient(url, anonKey)
}
