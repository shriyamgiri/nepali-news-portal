export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import Parser from 'rss-parser'
import { supabase } from '@/app/lib/supabase'

// ✅ 10 second timeout per source — prevents hanging on slow/dead sources
const parser = new Parser({ timeout: 10000 })

export async function POST(request: Request) {
  try {
    console.log('🚀 Starting news fetch...')

    const { data: sources, error: sourcesError } = await supabase
      .from('sources')
      .select('*')
      .eq('is_active', true)

    if (sourcesError) {
      return NextResponse.json({ error: 'Failed to fetch sources' }, { status: 500 })
    }

    if (!sources || sources.length === 0) {
      return NextResponse.json({ message: 'No active sources found' }, { status: 200 })
    }

    console.log(`📡 Found ${sources.length} active sources`)

    let totalFetched   = 0
    let totalNew       = 0
    let totalDuplicate = 0
    const fetchResults = []

    for (const source of sources) {
      console.log(`\n📰 Processing: ${source.name}`)

      const startTime = Date.now()
      let articlesFound     = 0
      let articlesNew       = 0
      let articlesDuplicate = 0

      try {
        let feedUrl = source.rss_feed_url

        if (!feedUrl) {
          feedUrl = await detectRssFeed(source.website_url)
        }

        if (!feedUrl) {
          console.log(`⚠️  No RSS feed for ${source.name}`)
          await supabase.from('fetch_logs').insert({
            source_id:       source.id,
            status:          'failed',
            error_message:   'No RSS feed URL found',
            articles_found:  0,
            articles_new:    0,
            articles_duplicate: 0,
            started_at:      new Date().toISOString(),
            completed_at:    new Date().toISOString(),
          })
          continue
        }

        console.log(`🔍 Fetching: ${feedUrl}`)

        // ✅ Wrap RSS parse in a timeout promise
        const feed = await Promise.race([
          parser.parseURL(feedUrl),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('RSS fetch timeout after 15s')), 15000)
          ),
        ]) as Awaited<ReturnType<typeof parser.parseURL>>

        articlesFound = feed.items.length
        console.log(`   Found ${articlesFound} articles`)

        for (const item of feed.items) {
          if (!item.link) continue

          const { data: existing } = await supabase
            .from('articles')
            .select('id')
            .eq('original_url', item.link)
            .single()

          if (existing) {
            articlesDuplicate++
            continue
          }

          const categorySlug = determineCategory(item, source)
          const { data: category } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', categorySlug)
            .single()

          const imageUrl = extractImageUrl(item.content || item.description || '')

          const { error: insertError } = await supabase
            .from('articles')
            .insert({
              source_id:         source.id,
              category_id:       category?.id || null,
              original_title:    item.title || 'Untitled',
              original_content:  item.content || item.contentSnippet || item.description || '',
              original_summary:  item.contentSnippet || item.description || '',
              original_language: source.language || 'en',
              original_url:      item.link || '',
              image_url:         imageUrl || item.enclosure?.url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800',
              author:            item.creator || item.author || null,
              published_at:      item.pubDate || item.isoDate || new Date().toISOString(),
              status:            'fetched',
              view_count:        0,
              like_count:        0,
              comment_count:     0,
            })

          if (!insertError) articlesNew++
          else console.error('Insert error:', insertError.message)
        }

        const duration = Date.now() - startTime

        await supabase.from('fetch_logs').insert({
          source_id:          source.id,
          status:             articlesNew > 0 ? 'success' : 'partial',
          articles_found:     articlesFound,
          articles_new:       articlesNew,
          articles_duplicate: articlesDuplicate,
          fetch_duration_ms:  duration,
          started_at:         new Date().toISOString(),
          completed_at:       new Date().toISOString(),
        })

        await supabase
          .from('sources')
          .update({ last_fetched_at: new Date().toISOString() })
          .eq('id', source.id)

        console.log(`   ✅ New: ${articlesNew} | Duplicate: ${articlesDuplicate}`)

        totalFetched   += articlesFound
        totalNew       += articlesNew
        totalDuplicate += articlesDuplicate

        fetchResults.push({
          source:    source.name,
          found:     articlesFound,
          new:       articlesNew,
          duplicate: articlesDuplicate,
          duration:  `${Date.now() - startTime}ms`,
        })

      } catch (error: any) {
        console.error(`   ❌ ${source.name}:`, error.message)

        await supabase.from('fetch_logs').insert({
          source_id:          source.id,
          status:             'failed',
          error_message:      error.message,
          articles_found:     0,
          articles_new:       0,
          articles_duplicate: 0,
          started_at:         new Date().toISOString(),
          completed_at:       new Date().toISOString(),
        })

        // ✅ Update last_fetched_at even on failure so it shows in admin
        await supabase
          .from('sources')
          .update({ last_fetched_at: new Date().toISOString() })
          .eq('id', source.id)

        fetchResults.push({ source: source.name, error: error.message })
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        sources_processed: sources.length,
        articles_found:    totalFetched,
        articles_new:      totalNew,
        articles_duplicate: totalDuplicate,
      },
      results: fetchResults,
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function detectRssFeed(websiteUrl: string): Promise<string | null> {
  const patterns = ['/rss', '/rss.xml', '/feed', '/feed.xml', '/index.xml', '/feeds/posts/default']
  for (const pattern of patterns) {
    const testUrl = websiteUrl.replace(/\/$/, '') + pattern
    try {
      const res = await fetch(testUrl, { method: 'HEAD', signal: AbortSignal.timeout(5000) })
      if (res.ok) return testUrl
    } catch { continue }
  }
  return null
}

// ✅ Made synchronous — no need to await for simple keyword matching
function determineCategory(item: any, source: any): string {
  const text = ((item.title || '') + ' ' + (item.contentSnippet || item.description || '')).toLowerCase()
  if (text.match(/election|government|parliament|minister|politics|party/i)) return 'politics'
  if (text.match(/economy|business|trade|market|stock|bank|finance/i))      return 'economy'
  if (text.match(/sport|football|cricket|game|player|match|champion/i))     return 'sports'
  if (text.match(/tech|technology|internet|software|app|digital|ai/i))      return 'tech'
  if (text.match(/health|medical|disease|hospital|doctor|covid/i))          return 'health'
  if (text.match(/entertainment|movie|music|celebrity|film|actor/i))        return 'entertainment'
  return source.category?.toLowerCase() || 'world'
}

function extractImageUrl(content: string): string | null {
  const match = content.match(/<img[^>]+src="([^">]+)"/i)
  return match?.[1] || null
}