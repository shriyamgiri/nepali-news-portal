export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/app/lib/supabase'

export async function POST(request: Request) {
  try {
    console.log('🧹 Starting cleanup of previous batch...')

    // Get all distinct batches ordered by time
    const { data: batches, error: batchError } = await supabase
      .from('articles')
      .select('batch_id, batch_time')
      .not('batch_id', 'is', null)
      .eq('status', 'fetched')
      .order('batch_time', { ascending: false })

    if (batchError) throw batchError

    if (!batches?.length) {
      return NextResponse.json({
        success: true,
        message: 'No batches found to clean',
        deleted: 0,
      })
    }

    // Get unique batch IDs ordered by time
    const uniqueBatches = [
      ...new Map(batches.map(b => [b.batch_id, b])).values()
    ].sort((a, b) =>
      new Date(b.batch_time).getTime() - new Date(a.batch_time).getTime()
    )

    console.log(`📦 Found ${uniqueBatches.length} batches`)

    // Current batch = most recent (index 0) → KEEP
    // Previous batch = index 1 → DELETE unpublished
    // Older batches = index 2+ → DELETE all unpublished

    if (uniqueBatches.length < 2) {
      return NextResponse.json({
        success: true,
        message: 'Only one batch exists - nothing to clean',
        deleted: 0,
      })
    }

    const currentBatchId = uniqueBatches[0].batch_id
    const batchesToDelete = uniqueBatches.slice(1).map(b => b.batch_id)

    console.log(`✅ Keeping current batch: ${currentBatchId}`)
    console.log(`🗑️ Deleting batches: ${batchesToDelete.join(', ')}`)

    // Get editorial config for score threshold
    const { data: configData } = await supabase
      .from('editorial_config')
      .select('config_key, config_value')
      .eq('config_key', 'batch_keep_score_threshold')
      .single()

    const keepThreshold = parseInt(configData?.config_value || '70')

    console.log(`📊 Score threshold for keeping: ${keepThreshold}`)

    // Delete unpublished articles from old batches
    // BUT keep any article scoring above threshold (still important news)
    const { data: deletedArticles, error: deleteError } = await supabase
      .from('articles')
      .delete()
      .in('batch_id', batchesToDelete)
      .eq('status', 'fetched')
      .lt('priority_score', keepThreshold)
      .select('id, original_title, priority_score, batch_id')

    if (deleteError) throw deleteError

    const deletedCount = deletedArticles?.length || 0

    // Check if any high-score articles were kept from old batches
    const { data: keptArticles } = await supabase
      .from('articles')
      .select('id, original_title, priority_score, batch_id')
      .in('batch_id', batchesToDelete)
      .eq('status', 'fetched')
      .gte('priority_score', keepThreshold)

    const keptCount = keptArticles?.length || 0

    console.log(`✅ Deleted: ${deletedCount} low-score articles`)
    console.log(`🌟 Kept: ${keptCount} high-score articles (score ≥ ${keepThreshold})`)

    return NextResponse.json({
      success: true,
      summary: {
        current_batch:    currentBatchId,
        batches_cleaned:  batchesToDelete.length,
        deleted:          deletedCount,
        kept_high_score:  keptCount,
        threshold_used:   keepThreshold,
      },
    })

  } catch (error: any) {
    console.error('❌ Cleanup error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  return POST(new Request(''))
}