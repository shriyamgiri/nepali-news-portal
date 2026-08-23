export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import Parser from 'rss-parser'
// ✅ Use supabaseAdmin for ALL operations in API routes
import { supabaseAdmin as supabase } from '@/app/lib/supabase'

const parser = new Parser({ timeout: 10000 })

export async function POST() {
  try {
    console.log('🚀 Smart fetch starting...')

    const { data: sources } = await supabase
      .from('sources')
      .select('*')
      .eq('is_active', true)

    if (!sources?.length) {
      return NextResponse.json({ message: 'No active sources' })
    }

    const { data: trendingTopics } = await supabase
      .from('trending_topics')
      .select('keyword, priority, source')
      .eq('is_active', true)
      .order('priority', { ascending: false })

    const keywords = trendingTopics || []
    console.log(`📡 ${sources.length} sources | 🔥 ${keywords.length} keywords`)

    interface ScoredArticle {
      title: string; content: string; summary: string
      url: string; imageUrl: string | null; author: string | null
      publishedAt: string; sourceId: string; sourceName: string
      language: string; category: string; score: number
      matchedKeywords: string[]
    }

    const allArticles: ScoredArticle[] = []

    for (const source of sources) {
      try {
        const feedUrl = source.rss_feed_url || await detectRssFeed(source.website_url)
        if (!feedUrl) continue

        const feed = await Promise.race([
          parser.parseURL(feedUrl),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 12000)
          ),
        ]) as Awaited<ReturnType<typeof parser.parseURL>>

        for (const item of feed.items || []) {
          if (!item.link || !item.title) continue

          const text = (item.title + ' ' + (item.contentSnippet || item.description || '')).toLowerCase()
          let score = 0
          const matchedKeywords: string[] = []

          for (const kw of keywords) {
            if (text.includes(kw.keyword.toLowerCase())) {
              score += kw.priority || 5
              matchedKeywords.push(kw.keyword)
            }
          }

          // If keywords exist but no match — skip
          // Nepal bonus - always prioritize Nepal content
          const isNepalRelated = text.includes('nepal') ||
                                 text.includes('kathmandu') ||
                                 text.includes('nepali') ||
                                text.includes('himalaya')

          if (isNepalRelated) score += 15

          // Never skip - give minimum score
          if (score === 0) score = 3

          // Recency bonus
          if (item.pubDate) {
            const ageHrs = (Date.now() - new Date(item.pubDate).getTime()) / 3600000
            if (ageHrs < 1)      score += 6
            else if (ageHrs < 3) score += 4
            else if (ageHrs < 6) score += 2
          }

          const imageUrl = extractImageUrl(item.content || item.description || '')
          if (imageUrl || item.enclosure?.url) score += 2

          allArticles.push({
            title:           item.title,
            content:         item.content || item.contentSnippet || item.description || '',
            summary:         item.contentSnippet || item.description || '',
            url:             item.link,
            imageUrl:        imageUrl || item.enclosure?.url || null,
            author:          item.creator || item.author || null,
            publishedAt:     item.pubDate || item.isoDate || new Date().toISOString(),
            sourceId:        source.id,
            sourceName:      source.name,
            language:        source.language || 'en',
            category:        determineCategory(item, source),
            score,
            matchedKeywords,
          })
        }

        await supabase
          .from('sources')
          .update({ last_fetched_at: new Date().toISOString() })
          .eq('id', source.id)

      } catch (err: any) {
        console.error(`⚠️ ${source.name}: ${err.message}`)
        await supabase.from('fetch_logs').insert({
          source_id: source.id, status: 'failed',
          error_message: err.message, articles_found: 0,
          articles_new: 0, articles_duplicate: 0,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        })
      }
    }

    console.log(`📊 ${allArticles.length} trending articles found`)

    // Deduplicate
    const deduplicated = deduplicateByTitle(allArticles)

    // Filter already-stored
    const urls = deduplicated.map(a => a.url)
    const { data: existing } = await supabase
      .from('articles')
      .select('original_url')
      .in('original_url', urls.slice(0, 100))

    const existingUrls = new Set(existing?.map((e: any) => e.original_url) || [])
    const newArticles  = deduplicated.filter(a => !existingUrls.has(a.url))

    // Top 10 by score
    const top10 = newArticles.sort((a, b) => b.score - a.score).slice(0, 10)

    console.log(`⭐ Saving top ${top10.length} articles`)

    let savedCount = 0
    for (const article of top10) {
      const { data: category } = await supabase
        .from('categories').select('id').eq('slug', article.category).single()

      const { error } = await supabase.from('articles').insert({
        source_id:         article.sourceId,
        category_id:       category?.id || null,
        original_title:    article.title,
        original_content:  article.content,
        original_summary:  article.summary,
        original_language: article.language,
        original_url:      article.url,
        image_url:         article.imageUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800',
        author:            article.author,
        published_at:      article.publishedAt,
        status:            'fetched',
        view_count:        0,
        like_count:        0,
        comment_count:     0,
      })

      if (!error) savedCount++
      else console.error('Insert error:', error.message)
    }

    await supabase.from('fetch_logs').insert({
      status:             'success',
      articles_found:     allArticles.length,
      articles_new:       savedCount,
      articles_duplicate: newArticles.length - savedCount,
      started_at:         new Date().toISOString(),
      completed_at:       new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      summary: {
        sources_scanned:  sources.length,
        trending_matched: allArticles.length,
        new_stories:      newArticles.length,
        saved:            savedCount,
      },
    })

  } catch (err: any) {
    console.error('❌ Fetch error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

function deduplicateByTitle(articles: any[]): any[] {
  const sorted = [...articles].sort((a, b) => b.score - a.score)
  const seen   = new Set<string>()
  const result = []
  for (const a of sorted) {
    const fp = a.title.toLowerCase().replace(/[^a-z\s]/g, '')
      .split(/\s+/).filter((w: string) => w.length > 4)
      .sort().slice(0, 5).join('|')
    if (!seen.has(fp)) { seen.add(fp); result.push(a) }
  }
  return result
}

function determineCategory(item: any, source: any): string {
  const t = ((item.title || '') + ' ' + (item.contentSnippet || '')).toLowerCase()
  if (t.match(/election|government|parliament|minister|politics|party/)) return 'politics'
  if (t.match(/economy|business|trade|market|stock|bank|finance/))       return 'economy'
  if (t.match(/sport|football|cricket|ipl|game|player|match|champion/)) return 'sports'
  if (t.match(/tech|technology|internet|software|app|digital|ai/))       return 'tech'
  if (t.match(/health|medical|disease|hospital|doctor|covid/))           return 'health'
  if (t.match(/entertainment|movie|music|celebrity|film|actor/))         return 'entertainment'
  return source.category?.toLowerCase() || 'world'
}

async function detectRssFeed(url: string): Promise<string | null> {
  for (const p of ['/rss', '/rss.xml', '/feed', '/feed.xml', '/index.xml']) {
    try {
      const r = await fetch(url.replace(/\/$/, '') + p, {
        method: 'HEAD', signal: AbortSignal.timeout(4000),
      })
      if (r.ok) return url.replace(/\/$/, '') + p
    } catch { continue }
  }
  return null
}

function extractImageUrl(content: string): string | null {
  return content.match(/<img[^>]+src="([^">]+)"/i)?.[1] || null
}