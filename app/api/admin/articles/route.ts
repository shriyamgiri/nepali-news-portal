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

    // ── Get current batch ID ──
    const { data: latestBatch } = await supabase
      .from('articles')
      .select('batch_id')
      .eq('status', 'fetched')
      .not('batch_id', 'is', null)
      .order('batch_time', { ascending: false })
      .limit(1)
      .single()

    const currentBatchId = latestBatch?.batch_id || null

    // ── Build main query ──
    // Use translated_at for published articles, created_at for others
    let query = supabase
      .from('articles')
      .select(`
        *,
        categories (name_en, name_ne),
        sources (name)
      `)
      .or(`translated_at.gte.${sinceDate},created_at.gte.${sinceDate}`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status && status !== 'all') {
      if (status === 'backlog') {
        if (currentBatchId) {
          query = supabase
            .from('articles')
            .select(`*, categories (name_en, name_ne), sources (name)`)
            .eq('status', 'fetched')
            .neq('batch_id', currentBatchId)
            .or(`translated_at.gte.${sinceDate},created_at.gte.${sinceDate}`)
            .order('created_at', { ascending: false })
            .limit(limit)
        }
      } else {
        query = query.eq('status', status)
      }
    }

    const { data, error } = await query
    if (error) throw error

    // ── Get counts using correct time columns ──
    const countFilter = `translated_at.gte.${sinceDate},created_at.gte.${sinceDate}`

    const [total, published, fetched, failed, translating] = await Promise.all([
      supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .or(countFilter),
      supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')
        .or(countFilter),
      supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'fetched')
        .or(countFilter),
      supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'failed')
        .or(countFilter),
      supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'translating')
        .or(countFilter),
    ])

    // ── Get backlog count ──
    let backlogCount = 0
    if (currentBatchId) {
      const { count } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'fetched')
        .neq('batch_id', currentBatchId)
        .or(countFilter)
      backlogCount = count || 0
    }

    // ── Get batch info ──
    const { data: batchInfo } = await supabase
      .from('articles')
      .select('batch_id, batch_time')
      .eq('status', 'fetched')
      .not('batch_id', 'is', null)
      .order('batch_time', { ascending: false })
      .limit(20)

    // Get unique batches
    const seenIds = new Set<string>()
    const uniqueBatches = (batchInfo || [])
      .filter(b => {
        if (seenIds.has(b.batch_id)) return false
        seenIds.add(b.batch_id)
        return true
      })
      .sort((a, b) =>
        new Date(b.batch_time).getTime() - new Date(a.batch_time).getTime()
      )

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