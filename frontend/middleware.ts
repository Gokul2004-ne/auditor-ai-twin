import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dkpcclyyuqzseqqmfqvh.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrcGNjbHl5dXF6c2VxcW1mcXZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUxMDM4OTQsImV4cCI6MjExMDY3OTg5NH0.LZLNww63gbnfupuYdaBwC71wSBQ-Lf6hqhYVu39p7cE',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isPublicRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/verify') ||
    pathname === '/'

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && pathname.startsWith('/login')) {
    const isAuditee =
      user.user_metadata?.role === 'auditee' ||
      user.email?.toLowerCase().includes('auditee')

    const url = request.nextUrl.clone()
    url.pathname = isAuditee ? '/auditee/dashboard' : '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
