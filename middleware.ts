import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isAdminRoute      = pathname.startsWith('/admin')
  const isAdminLoginRoute = pathname === '/admin/login'

  if (isAdminRoute && !isAdminLoginRoute) {
    const session = request.cookies.get('admin_session')

    // ✅ No session cookie → redirect to login
    if (!session?.value) {
      const loginUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  // ✅ Already logged in → skip login page, go straight to dashboard
  if (isAdminLoginRoute) {
    const session = request.cookies.get('admin_session')
    if (session?.value) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}