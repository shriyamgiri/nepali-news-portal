import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE = 'admin_session'
const SESSION_VALUE  = 'khabar_admin_authenticated'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only protect /admin routes (but NOT /admin/login itself)
  const isAdminRoute      = pathname.startsWith('/admin')
  const isAdminLoginRoute = pathname === '/admin/login'

  if (isAdminRoute && !isAdminLoginRoute) {
    const session = request.cookies.get(SESSION_COOKIE)?.value

    // Not logged in → redirect to login
    if (session !== SESSION_VALUE) {
      const loginUrl = new URL('/admin/login', request.url)
      // Pass the original URL so we can redirect back after login
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Already logged in and visiting login page → redirect to dashboard
  if (isAdminLoginRoute) {
    const session = request.cookies.get(SESSION_COOKIE)?.value
    if (session === SESSION_VALUE) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  // Run middleware on all /admin routes
  matcher: ['/admin/:path*'],
}
