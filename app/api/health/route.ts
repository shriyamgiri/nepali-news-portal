export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

export async function GET() {
  const startTime = Date.now()
  const checks: Record<string, any> = {}

  // ── 1. Database connection ──
  try {
    const { count } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
    checks.database = { status: 'healthy', articles: count }
  } catch (err: any) {
    checks.database = { status: 'unhealthy', error: err.message }
  }

  // ── 2. Latest fetch status ──
  try {
    const { data } = await supabase
      .from('fetch_logs')
      .select('status, started_at, articles_new')
      .order('started_at', { ascending: false })
      .limit(1)
      .single()

    const lastFetch = data?.started_at ? new Date(data.started_at) : null
    const minsAgo   = lastFetch ? Math.round((Date.now() - lastFetch.getTime()) / 60000) : null

    checks.last_fetch = {
      status:      data?.status || 'never',
      minutes_ago: minsAgo,
      articles_new: data?.articles_new || 0,
      healthy:     minsAgo !== null && minsAgo < 60,
    }
  } catch {
    checks.last_fetch = { status: 'unknown' }
  }

  // ── 3. Translation pipeline ──
  try {
    const { count: pendingCount } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'fetched')

    const { count: stuckCount } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'translating')
      .lt('updated_at', new Date(Date.now() - 15 * 60 * 1000).toISOString())

    checks.translation = {
      pending_articles: pendingCount || 0,
      stuck_articles:   stuckCount || 0,
      healthy:          (stuckCount || 0) === 0,
    }
  } catch {
    checks.translation = { status: 'unknown' }
  }

  // ── 4. Published articles today ──
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { count: todayCount } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .gte('translated_at', today.toISOString())

    checks.publishing = {
      articles_today: todayCount || 0,
      healthy:        (todayCount || 0) > 0,
    }
  } catch {
    checks.publishing = { status: 'unknown' }
  }

  // ── 5. Facebook posting ──
  try {
    const { count: unpostedCount } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .eq('facebook_posted', false)
      .not('nepali_title', 'is', null)

    checks.facebook = {
      unposted_articles: unpostedCount || 0,
      healthy:           (unpostedCount || 0) < 50,
    }
  } catch {
    checks.facebook = { status: 'unknown' }
  }

  // ── Overall health ──
  const allHealthy = Object.values(checks).every(
    (c: any) => c.status !== 'unhealthy' && c.healthy !== false
  )

  const responseTime = Date.now() - startTime

  return NextResponse.json({
    status:        allHealthy ? 'healthy' : 'degraded',
    version:       '1.0.0',
    portal:        'GN Nepal',
    timestamp:     new Date().toISOString(),
    response_time: `${responseTime}ms`,
    checks,
  }, {
    status: allHealthy ? 200 : 207,
  })
}
