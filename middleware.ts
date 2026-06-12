import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE = 'admin_session'

// ── Rate limiting store (in-memory, resets on redeploy) ──
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function getRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now  = Date.now()
  const data = rateLimitMap.get(ip)

  if (!data || now > data.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs })
    return true // allowed
  }

  if (data.count >= limit) return false // blocked

  data.count++
  return true // allowed
}

function getIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip           = getIP(request)

  // ── 1. Block suspicious bots and scanners ──
  const userAgent = request.headers.get('user-agent') || ''
  const blockedBots = ['sqlmap', 'nikto', 'nmap', 'masscan', 'zgrab', 'dirbuster']
  if (blockedBots.some(bot => userAgent.toLowerCase().includes(bot))) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  // ── 2. Rate limit API routes ──
  if (pathname.startsWith('/api/')) {
    // Very strict limit on auth endpoint (prevent brute force)
    if (pathname === '/api/admin/login') {
      if (!getRateLimit(`login:${ip}`, 10, 15 * 60 * 1000)) {
        return NextResponse.json(
          { error: 'Too many login attempts. Try again in 15 minutes.' },
          { status: 429 }
        )
      }
    }

    // Moderate limit on other API routes
    if (!getRateLimit(`api:${ip}`, 100, 60 * 1000)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please slow down.' },
        { status: 429 }
      )
    }

    // Protect cron endpoint — only allow from GitHub Actions or Vercel cron
    if (pathname === '/api/cron') {
      const cronSecret    = request.headers.get('x-cron-secret')
      const expectedSecret = process.env.CRON_SECRET
      const isVercelCron  = request.headers.get('x-vercel-cron') === '1'

      if (expectedSecret && !isVercelCron && cronSecret !== expectedSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }
  }

  // ── 3. Protect admin routes ──
  const isAdminRoute      = pathname.startsWith('/admin')
  const isAdminLoginRoute = pathname === '/admin/login'

  if (isAdminRoute && !isAdminLoginRoute) {
    const session = request.cookies.get(SESSION_COOKIE)
    if (!session?.value) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // Already logged in → skip login page
  if (isAdminLoginRoute) {
    const session = request.cookies.get(SESSION_COOKIE)
    if (session?.value) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  // ── 4. Add security headers to all responses ──
  const response = NextResponse.next()

  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; img-src * data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' *.google.com *.googleapis.com pagead2.googlesyndication.com; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; connect-src 'self' *.supabase.co; frame-src 'none';"
  )

  return response
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico|images/).*)',
  ],
}