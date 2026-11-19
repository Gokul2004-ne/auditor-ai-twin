import axios from 'axios'
import { createClient } from '@/lib/supabase/client'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-08e55d53.up.railway.app'

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach Supabase access token to every request
apiClient.interceptors.request.use(async (config) => {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`
    }
  } catch (err) {
    console.warn('Could not retrieve Supabase session for API call', err)
  }
  return config
})

export default apiClient
