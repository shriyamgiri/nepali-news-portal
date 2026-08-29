export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/app/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const timeRange = searchParams.get('timeRange') || '24h'
    const limit = parseInt(searchParams.get('limit') || '100')

    // Time range calculation
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
    let currentBatchId: string | null = null
    let previousBatchId: string | null = null

    try {
      const { data: batchData } = await supabase
        .from('articles')
        .select('batch_id, batch_time')
        .eq('status', 'fetched')
        .not('batch_id', 'is', null)
        .order('batch_time', { ascending: false })
        .limit(20)

      if (batchData?.length) {
        const seenIds = new Set<string>()
        const uniqueBatches = batchData
          .filter(b => {
            if (!b.batch_id || seenIds.has(b.batch_id)) return false
            seenIds.add(b.batch_id)
            return true
          })
          .sort((a, b) =>
            new Date(b.batch_time).getTime() - new Date(a.batch_time).getTime()
          )
        currentBatchId = uniqueBatches[0]?.batch_id || null
        previousBatchId = uniqueBatches[1]?.batch_id || null
      }
    } catch (e) {
      console.error('Batch lookup error:', e)
    }

    // ── Build main query ──
    let data: any[] = []
    let queryError: any = null

    if (status === 'backlog' && currentBatchId) {
      const { data: d, error: e } = await supabase
        .from('articles')
        .select(`*, categories (name_en, name_ne), sources (name)`)
        .eq('status', 'fetched')
        .neq('batch_id', currentBatchId)
        .gte('created_at', sinceDate)
        .order('created_at', { ascending: false })
        .limit(limit)
      data = d || []
      queryError = e
    } else if (status === 'all') {
      const { data: d, error: e } = await supabase
        .from('articles')
        .select(`*, categories (name_en, name_ne), sources (name)`)
        .gte('created_at', sinceDate)
        .order('created_at', { ascending: false })
        .limit(limit)
      data = d || []
      queryError = e
    } else {
      const { data: d, error: e } = await supabase
        .from('articles')
        .select(`*, categories (name_en, name_ne), sources (name)`)
        .eq('status', status)
        .gte('created_at', sinceDate)
        .order('created_at', { ascending: false })
        .limit(limit)
      data = d || []
      queryError = e
    }

    if (queryError) throw queryError

    // ── Get counts ──
    const [total, published, fetched, failed, translating] = await Promise.all([
      supabase.from('articles').select('*', { count: 'exact', head: true })
        .gte('created_at', sinceDate),
      supabase.from('articles').select('*', { count: 'exact', head: true })
        .eq('status', 'published').gte('created_at', sinceDate),
      supabase.from('articles').select('*', { count: 'exact', head: true })
        .eq('status', 'fetched').gte('created_at', sinceDate),
      supabase.from('articles').select('*', { count: 'exact', head: true })
        .eq('status', 'failed').gte('created_at', sinceDate),
      supabase.from('articles').select('*', { count: 'exact', head: true })
        .eq('status', 'translating').gte('created_at', sinceDate),
    ])

    // ── Backlog count ──
    let backlogCount = 0
    if (currentBatchId) {
      const { count } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'fetched')
        .neq('batch_id', currentBatchId)
        .gte('created_at', sinceDate)
      backlogCount = count || 0
    }

    // ── Batch info ──
    let currentBatch = null
    let previousBatch = null

    if (currentBatchId) {
      const { data: cb } = await supabase
        .from('articles')
        .select('batch_id, batch_time')
        .eq('batch_id', currentBatchId)
        .limit(1)
        .single()
      currentBatch = cb
    }

    if (previousBatchId) {
      const { data: pb } = await supabase
        .from('articles')
        .select('batch_id, batch_time')
        .eq('batch_id', previousBatchId)
        .limit(1)
        .single()
      previousBatch = pb
    }

    return NextResponse.json({
      articles: data,
      counts: {
        total: total.count || 0,
        published: published.count || 0,
        fetched: fetched.count || 0,
        failed: failed.count || 0,
        translating: translating.count || 0,
        backlog: backlogCount,
      },
      currentBatch,
      previousBatch,
    })

  } catch (error: any) {
    console.error('Articles API error:', error)
    return NextResponse.json(
      { error: error.message, articles: [], counts: {} },
      { status: 500 }
    )
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