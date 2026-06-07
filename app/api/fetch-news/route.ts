export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import Parser from 'rss-parser'
import { supabase } from '@/app/lib/supabase'

const parser = new Parser({ timeout: 10000 })

// ── Types ──
interface RawArticle {
  title:       string
  content:     string
  summary:     string
  url:         string
  imageUrl:    string | null
  author:      string | null
  publishedAt: string
  sourceId:    string
  sourceName:  string
  language:    string
  category:    string
  score:       number
  matchedKeywords: string[]
}

export async function POST() {
  try {
    console.log('🚀 Smart fetch started...')

    // ── 1. Load active sources ──
    const { data: sources } = await supabase
      .from('sources')
      .select('*')
      .eq('is_active', true)

    if (!sources?.length) {
      return NextResponse.json({ message: 'No active sources' })
    }

    // ── 2. Load trending keywords ──
    const { data: trendingTopics } = await supabase
      .from('trending_topics')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false })

    const keywords = trendingTopics || []
    console.log(`📡 ${sources.length} sources | 🔥 ${keywords.length} trending keywords`)

    // ── 3. Fetch all RSS feeds (scan only, don't store yet) ──
    const allRawArticles: RawArticle[] = []

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

          const content = item.content || item.contentSnippet || item.description || ''
          const text    = (item.title + ' ' + content).toLowerCase()

          // Score this article against trending keywords
          let score            = 0
          const matchedKeywords: string[] = []

          for (const kw of keywords) {
            const kwLower = kw.keyword.toLowerCase()
            if (text.includes(kwLower)) {
              score += kw.priority || 5
              matchedKeywords.push(kw.keyword)
            }
          }

          // Recency bonus
          const ageHours = item.pubDate
            ? (Date.now() - new Date(item.pubDate).getTime()) / 3600000
            : 24
          if (ageHours < 1)  score += 5
          else if (ageHours < 3)  score += 3
          else if (ageHours < 6)  score += 1

          // Image bonus
          const imageUrl = extractImageUrl(content) || item.enclosure?.url || null
          if (imageUrl) score += 2

          // Content length bonus
          if (content.length > 300) score += 2

          // Only consider articles with at least one keyword match
          if (score === 0) continue

          allRawArticles.push({
            title:       item.title,
            content,
            summary:     item.contentSnippet || item.description || '',
            url:         item.link,
            imageUrl,
            author:      item.creator || item.author || null,
            publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
            sourceId:    source.id,
            sourceName:  source.name,
            language:    source.language || 'en',
            category:    determineCategory(item, source),
            score,
            matchedKeywords,
          })
        }

        // Update last_fetched_at
        await supabase
          .from('sources')
          .update({ last_fetched_at: new Date().toISOString() })
          .eq('id', source.id)

      } catch (err: any) {
        console.error(`⚠️ ${source.name}: ${err.message}`)
      }
    }

    console.log(`📊 Scanned ${allRawArticles.length} relevant articles across all sources`)

    // ── 4. Auto-detect trending topics from cross-source overlap ──
    const autoTrending = detectCrossSourceTrends(allRawArticles)
    console.log(`🔥 Auto-detected ${autoTrending.length} trending topics:`, autoTrending.slice(0, 5))

    // Boost score for cross-source trending topics
    for (const article of allRawArticles) {
      for (const trend of autoTrending) {
        if (article.title.toLowerCase().includes(trend.toLowerCase())) {
          article.score += 8 // Cross-source trending bonus
          if (!article.matchedKeywords.includes(trend)) {
            article.matchedKeywords.push(trend + ' (auto)')
          }
        }
      }
    }

    // ── 5. Deduplicate — same story from multiple sources = keep best ──
    const deduplicated = deduplicateArticles(allRawArticles)
    console.log(`🔄 After dedup: ${deduplicated.length} unique stories`)

    // ── 6. Filter out already-stored articles ──
    const urls       = deduplicated.map(a => a.url)
    const { data: existing } = await supabase
      .from('articles')
      .select('original_url')
      .in('original_url', urls)

    const existingUrls = new Set(existing?.map(e => e.original_url) || [])
    const newArticles  = deduplicated.filter(a => !existingUrls.has(a.url))
    console.log(`🆕 ${newArticles.length} genuinely new stories`)

    // ── 7. Pick TOP 10 by score ──
    const top10 = newArticles
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)

    console.log(`⭐ Top 10 selected`)
    top10.forEach((a, i) =>
      console.log(`   ${i + 1}. [${a.score}pts] ${a.title.substring(0, 60)} (${a.matchedKeywords.join(', ')})`)
    )

    // ── 8. Store only TOP 10 in database ──
    let savedCount = 0
    for (const article of top10) {
      const { data: category } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', article.category)
        .single()

      const { error } = await supabase
        .from('articles')
        .insert({
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
    }

    // Log fetch operation
    await supabase.from('fetch_logs').insert({
      status:             'success',
      articles_found:     allRawArticles.length,
      articles_new:       savedCount,
      articles_duplicate: newArticles.length - savedCount,
      started_at:         new Date().toISOString(),
      completed_at:       new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      summary: {
        sources_scanned:      sources.length,
        trending_articles:    allRawArticles.length,
        unique_stories:       deduplicated.length,
        new_stories:          newArticles.length,
        saved_top_10:         savedCount,
        auto_trending_topics: autoTrending.slice(0, 10),
      },
    })

  } catch (err: any) {
    console.error('❌ Smart fetch error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ── Auto-detect trending: topics covered by 3+ sources ──
function detectCrossSourceTrends(articles: RawArticle[]): string[] {
  const wordMap: Record<string, Set<string>> = {}

  for (const article of articles) {
    const words = article.title
      .toLowerCase()
      .replace(/[^a-zA-Z\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 4) // meaningful words only

    for (const word of words) {
      if (!wordMap[word]) wordMap[word] = new Set()
      wordMap[word].add(article.sourceId)
    }
  }

  // Return words covered by 3+ different sources
  return Object.entries(wordMap)
    .filter(([_, sources]) => sources.size >= 3)
    .sort((a, b) => b[1].size - a[1].size)
    .map(([word]) => word)
    .slice(0, 20)
}

// ── Deduplicate: same story from multiple sources → keep highest score ──
function deduplicateArticles(articles: RawArticle[]): RawArticle[] {
  const sorted = [...articles].sort((a, b) => b.score - a.score)
  const seen   = new Set<string>()
  const result: RawArticle[] = []

  for (const article of sorted) {
    // Create a normalized "story fingerprint" from title keywords
    const fingerprint = article.title
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 4)
      .sort()
      .slice(0, 5)
      .join('|')

    if (!seen.has(fingerprint)) {
      seen.add(fingerprint)
      result.push(article)
    }
  }

  return result
}

// ── Category detection ──
function determineCategory(item: any, source: any): string {
  const text = ((item.title || '') + ' ' + (item.contentSnippet || '')).toLowerCase()
  if (text.match(/election|government|parliament|minister|politics|party/i)) return 'politics'
  if (text.match(/economy|business|trade|market|stock|bank|finance/i))      return 'economy'
  if (text.match(/sport|football|cricket|ipl|game|player|match|champion/i)) return 'sports'
  if (text.match(/tech|technology|internet|software|app|digital|ai/i))      return 'tech'
  if (text.match(/health|medical|disease|hospital|doctor|covid/i))          return 'health'
  if (text.match(/entertainment|movie|music|celebrity|film|actor/i))        return 'entertainment'
  return source.category?.toLowerCase() || 'world'
}

// ── RSS auto-detect ──
async function detectRssFeed(websiteUrl: string): Promise<string | null> {
  const patterns = ['/rss', '/rss.xml', '/feed', '/feed.xml', '/index.xml']
  for (const p of patterns) {
    try {
      const url = websiteUrl.replace(/\/$/, '') + p
      const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(4000) })
      if (res.ok) return url
    } catch { continue }
  }
  return null
}

// ── Extract image from HTML ──
function extractImageUrl(content: string): string | null {
  return content.match(/<img[^>]+src="([^">]+)"/i)?.[1] || null
}