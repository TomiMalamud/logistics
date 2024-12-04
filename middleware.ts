// middleware.ts
import { type NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // Allow access to reset-password page without authentication
  if (request.nextUrl.pathname === '/reset-password' || 
    request.nextUrl.searchParams.has('token')) {
  return NextResponse.next()
}

  // Update session first
  const response = await updateSession(request)
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set() {}, 
        remove() {}, 
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()

  // Protect all routes except login
  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    const redirectUrl = new URL('/login', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect logged in users away from login page
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    const redirectUrl = new URL('/', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}