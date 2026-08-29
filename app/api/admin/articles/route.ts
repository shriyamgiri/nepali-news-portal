export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/app/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const timeRange = searchParams.get('timeRange') || '24h'
    const limit = parseInt(searchParams.get('limit') || '100')

    // Time range filter
    const timeMap: Record<string, number> = {
      '30m': 30,
      '1h': 60,
      '3h': 180,
      '6h': 360,
      '12h': 720,
      '24h': 1440,
      '7d': 10080,
      '30d': 43200,
    }
    const minutes = timeMap[timeRange] || 1440
    const sinceDate = new Date(Date.now() - minutes * 60 * 1000).toISOString()

    let query = supabase
      .from('articles')
      .select(`
        *,
        categories (name_en, name_ne),
        sources (name)
      `)
      .gte('created_at', sinceDate)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status && status !== 'all') {
      if (status === 'backlog') {
        // Backlog = fetched articles from previous batch
        // Get current batch_id first
        const { data: latestBatch } = await supabase
          .from('articles')
          .select('batch_id')
          .eq('status', 'fetched')
          .not('batch_id', 'is', null)
          .order('batch_time', { ascending: false })
          .limit(1)
          .single()

        if (latestBatch?.batch_id) {
          query = supabase
            .from('articles')
            .select(`*, categories (name_en, name_ne), sources (name)`)
            .eq('status', 'fetched')
            .neq('batch_id', latestBatch.batch_id)
            .gte('created_at', sinceDate)
            .order('created_at', { ascending: false })
            .limit(limit)
        }
      } else {
        query = query.eq('status', status)
      }
    }

    const { data, error } = await query
    if (error) throw error

    // Get counts for all statuses within time range
    const [total, published, fetched, failed, translating] = await Promise.all([
      supabase.from('articles').select('*', { count: 'exact', head: true }).gte('created_at', sinceDate),
      supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'published').gte('created_at', sinceDate),
      supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'fetched').gte('created_at', sinceDate),
      supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'failed').gte('created_at', sinceDate),
      supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'translating').gte('created_at', sinceDate),
    ])

    // Get backlog count (fetched from previous batch)
    const { data: latestBatch } = await supabase
      .from('articles')
      .select('batch_id')
      .eq('status', 'fetched')
      .not('batch_id', 'is', null)
      .order('batch_time', { ascending: false })
      .limit(1)
      .single()

    let backlogCount = 0
    if (latestBatch?.batch_id) {
      const { count } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'fetched')
        .neq('batch_id', latestBatch.batch_id)
        .gte('created_at', sinceDate)
      backlogCount = count || 0
    }

    // Get current batch info
    const { data: batchInfo } = await supabase
      .from('articles')
      .select('batch_id, batch_time')
      .eq('status', 'fetched')
      .not('batch_id', 'is', null)
      .order('batch_time', { ascending: false })
      .limit(2)

    const uniqueBatches = batchInfo
      ? Array.from(new Map(batchInfo.map(b => [b.batch_id, b])).values())
      : []

    return NextResponse.json({
      articles: data || [],
      counts: {
        total: total.count || 0,
        published: published.count || 0,
        fetched: fetched.count || 0,
        failed: failed.count || 0,
        translating: translating.count || 0,
        backlog: backlogCount,
      },
      currentBatch: uniqueBatches[0] || null,
      previousBatch: uniqueBatches[1] || null,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Article ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}