import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE = 'admin_session'

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function getRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now  = Date.now()
  const data = rateLimitMap.get(ip)
  if (!data || now > data.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (data.count >= limit) return false
  data.count++
  return true
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

  // ── Block malicious bots ──
  const ua          = request.headers.get('user-agent') || ''
  const blockedBots = ['sqlmap', 'nikto', 'nmap', 'masscan', 'zgrab', 'dirbuster']
  if (blockedBots.some(bot => ua.toLowerCase().includes(bot))) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  // ── Protect /api/cron ──
  // Allow if: has valid admin session cookie OR valid cron secret header OR Vercel cron
  if (pathname === '/api/cron') {
    const cronSecret     = request.headers.get('x-cron-secret')
    const expectedSecret = process.env.CRON_SECRET
    const isVercelCron   = request.headers.get('x-vercel-cron') === '1'
    const adminSession   = request.cookies.get(SESSION_COOKIE)?.value

    // ✅ Allow if: Vercel cron, OR valid secret, OR logged-in admin
    const allowed =
      isVercelCron ||
      (expectedSecret && cronSecret === expectedSecret) ||
      !!adminSession ||
      !expectedSecret  // if no secret set yet, allow all (development)

    if (!allowed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  // ── Rate limit login endpoint ──
  if (pathname === '/api/admin/login') {
    if (!getRateLimit(`login:${ip}`, 10, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'Too many login attempts. Try again in 15 minutes.' },
        { status: 429 }
      )
    }
  }

  // ── Rate limit other API routes ──
  if (pathname.startsWith('/api/') && pathname !== '/api/cron') {
    if (!getRateLimit(`api:${ip}`, 200, 60 * 1000)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded.' },
        { status: 429 }
      )
    }
  }

  // ── Protect admin routes ──
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

  // ── Security headers ──
  const response = NextResponse.next()
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
}