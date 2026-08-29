export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import Parser from 'rss-parser'
import { supabaseAdmin as supabase } from '@/app/lib/supabase'

const parser = new Parser({
  timeout: 10000,
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: true }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: true }],
      ['media:group', 'mediaGroup'],
      ['content:encoded', 'contentEncoded'],
    ]
  }
})

export async function POST() {
  try {
    console.log('🚀 Smart fetch starting...')

    const { data: configData } = await supabase
      .from('editorial_config')
      .select('config_key, config_value')

    const config: Record<string, string> = {}
    configData?.forEach((item: any) => {
      config[item.config_key] = item.config_value
    })

    const NEPAL_BONUS = parseInt(config.nepal_keyword_bonus || '40')
    const MIN_SCORE = parseInt(config.min_score_to_save || '3')
    const TOP_N = parseInt(config.batch_size || '10')
    const NEPAL_KEYWORDS = (config.nepal_keywords || 'nepal,kathmandu,nepali,himalaya,pokhara')
      .split(',').map((k: string) => k.trim().toLowerCase())
    const KEEP_THRESHOLD = parseInt(config.batch_keep_score_threshold || '70')

    console.log(`📋 Config: Nepal bonus=${NEPAL_BONUS}, Min score=${MIN_SCORE}, Keep threshold=${KEEP_THRESHOLD}`)

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
    console.log(`📡 ${sources.length} sources | 🔥 ${keywords.length} trending keywords`)

    const { data: sportsEvents } = await supabase
      .from('sports_events')
      .select('keywords, score_boost, event_name')
      .eq('is_active', true)

    const sportKeywords: { keyword: string; boost: number; event: string }[] = []
    sportsEvents?.forEach((event: any) => {
      event.keywords.split(',').forEach((kw: string) => {
        sportKeywords.push({
          keyword: kw.trim().toLowerCase(),
          boost: event.score_boost,
          event: event.event_name,
        })
      })
    })

    console.log(`⚽ ${sportKeywords.length} sport keywords active`)

    // ══════════════════════════════════════════
    // PHASE 1: RE-SCORE PREVIOUS BATCH BACKLOG
    // ══════════════════════════════════════════
    console.log('\n📦 Phase 1: Re-scoring previous batch backlog...')

    const { data: previousBacklog } = await supabase
      .from('articles')
      .select('id, original_title, original_content, original_summary, priority_score, batch_id, batch_time')
      .eq('status', 'fetched')
      .not('batch_id', 'is', null)

    if (previousBacklog?.length) {
      console.log(`🔄 Re-scoring ${previousBacklog.length} backlog articles...`)

      for (const article of previousBacklog) {
        const text = (
          (article.original_title || '') + ' ' +
          (article.original_content || '') + ' ' +
          (article.original_summary || '')
        ).toLowerCase()

        let newScore = 0

        for (const kw of keywords) {
          if (text.includes(kw.keyword.toLowerCase())) {
            newScore += kw.priority || 5
          }
        }

        const isNepal = NEPAL_KEYWORDS.some(kw => text.includes(kw))
        if (isNepal) newScore += NEPAL_BONUS

        for (const sport of sportKeywords) {
          if (text.includes(sport.keyword)) {
            newScore += sport.boost
            break
          }
        }

        newScore += 10

        const batchTime = article.batch_time
          ? new Date(article.batch_time).getTime()
          : Date.now()
        const ageMinutes = (Date.now() - batchTime) / 60000
        const decayFactor = Math.max(0.3, 1 - (ageMinutes / 120))
        newScore = Math.round(newScore * decayFactor)

        if (newScore < MIN_SCORE) newScore = MIN_SCORE

        await supabase
          .from('articles')
          .update({ priority_score: newScore })
          .eq('id', article.id)
      }

      console.log('✅ Previous batch re-scored with time decay')
    } else {
      console.log('ℹ️ No previous batch backlog found')
    }

    // ══════════════════════════════════════════
    // PHASE 2: FETCH NEW ARTICLES FROM SOURCES
    // ══════════════════════════════════════════
    console.log('\n📰 Phase 2: Fetching new articles from sources...')

    const currentBatchId = new Date().toISOString()
    const currentBatchTime = new Date().toISOString()

    interface ScoredArticle {
      title: string
      content: string
      summary: string
      url: string
      imageUrl: string | null
      author: string | null
      publishedAt: string
      sourceId: string
      sourceName: string
      language: string
      category: string
      score: number
      matchedKeywords: string[]
      isBreaking: boolean
      nepalRelated: boolean
    }

    const allArticles: ScoredArticle[] = []

    for (const source of sources) {
      try {
        const feedUrl = source.rss_feed_url || await detectRssFeed(source.website_url)
        if (!feedUrl) {
          console.log(`⚠️ No RSS feed for ${source.name}`)
          continue
        }

        const feed = await Promise.race([
          parser.parseURL(feedUrl),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 12000)
          ),
        ]) as Awaited<ReturnType<typeof parser.parseURL>>

        for (const rawItem of feed.items || []) {
          const item = rawItem as any

          if (!item.link || !item.title) continue

          const text = (
            item.title + ' ' +
            (item.contentSnippet || item.description || '')
          ).toLowerCase()

          let score = 0
          const matchedKeywords: string[] = []

          // 1. Trending Keywords
          for (const kw of keywords) {
            if (text.includes(kw.keyword.toLowerCase())) {
              score += kw.priority || 5
              matchedKeywords.push(kw.keyword)
            }
          }

          // 2. Nepal Relevance
          const isNepalRelated = NEPAL_KEYWORDS.some(kw => text.includes(kw))
          if (isNepalRelated) {
            score += NEPAL_BONUS
            matchedKeywords.push('🇳🇵 Nepal')
          }

          // 3. Sports Events
          for (const sport of sportKeywords) {
            if (text.includes(sport.keyword)) {
              score += sport.boost
              matchedKeywords.push(`⚽ ${sport.event}`)
              break
            }
          }

          // 4. Breaking News
          const breakingWords = (
            config.breaking_keywords ||
            'breaking,urgent,alert,just in,developing,exclusive,flash'
          ).split(',').map((k: string) => k.trim().toLowerCase())

          const isBreaking = breakingWords.some(bw => text.includes(bw))
          if (isBreaking) {
            score += 20
            matchedKeywords.push('🔴 Breaking')
          }

          // 5. Source Credibility
          const credibilityBoost = (source.credibility_score || 5) *
            parseInt(config.source_credibility_multiplier || '2')
          score += credibilityBoost

          // 6. Recency
          if (item.pubDate) {
            const ageHrs = (Date.now() - new Date(item.pubDate).getTime()) / 3600000
            if (ageHrs < 0.5) score += parseInt(config.recency_30min_bonus || '10')
            else if (ageHrs < 1) score += parseInt(config.recency_1hr_bonus || '8')
            else if (ageHrs < 3) score += parseInt(config.recency_3hr_bonus || '5')
            else if (ageHrs < 6) score += parseInt(config.recency_6hr_bonus || '2')
          }

          // 7. Image extraction
          const imageUrl = extractBestImage(item)
          if (imageUrl) score += 2

          if (score < MIN_SCORE) score = MIN_SCORE

          allArticles.push({
            title: item.title,
            content: item.content || item.contentSnippet || item.description || '',
            summary: item.contentSnippet || item.description || '',
            url: item.link,
            imageUrl,
            author: item.creator || item.author || null,
            publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
            sourceId: source.id,
            sourceName: source.name,
            language: source.language || 'en',
            category: determineCategory(item, source),
            score,
            matchedKeywords,
            isBreaking,
            nepalRelated: isNepalRelated,
          })
        }

        await supabase
          .from('sources')
          .update({ last_fetched_at: new Date().toISOString() })
          .eq('id', source.id)

      } catch (err: any) {
        console.error(`⚠️ ${source.name}: ${err.message}`)
        await supabase.from('fetch_logs').insert({
          source_id: source.id,
          status: 'failed',
          error_message: err.message,
          articles_found: 0,
          articles_new: 0,
          articles_duplicate: 0,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        })
      }
    }

    console.log(`📊 ${allArticles.length} total articles scored`)

    const deduplicated = deduplicateByTitle(allArticles)

    const urls = deduplicated.map(a => a.url)
    const { data: existing } = await supabase
      .from('articles')
      .select('original_url')
      .in('original_url', urls.slice(0, 100))

    const existingUrls = new Set(existing?.map((e: any) => e.original_url) || [])
    const newArticles = deduplicated.filter(a => !existingUrls.has(a.url))

    const topArticles = newArticles
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_N)

    console.log(`⭐ Saving top ${topArticles.length} articles (batch: ${currentBatchId})`)

    let savedCount = 0

    for (const article of topArticles) {
      const { data: category } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', article.category)
        .single()

      const breakingExpiresAt = article.isBreaking
        ? new Date(Date.now() + 90 * 60 * 1000).toISOString()
        : null

      const finalImageUrl = article.imageUrl ||
        'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800'

      const { error } = await supabase.from('articles').insert({
        source_id: article.sourceId,
        category_id: category?.id || null,
        original_title: article.title,
        original_content: article.content,
        original_summary: article.summary,
        original_language: article.language,
        original_url: article.url,
        image_url: finalImageUrl,
        author: article.author,
        published_at: article.publishedAt,
        status: 'fetched',
        priority_score: article.score,
        is_breaking: article.isBreaking,
        breaking_expires_at: breakingExpiresAt,
        nepal_related: article.nepalRelated,
        batch_id: currentBatchId,
        batch_time: currentBatchTime,
        view_count: 0,
        like_count: 0,
        comment_count: 0,
      })

      if (!error) {
        savedCount++
        const imgStatus = article.imageUrl ? '🖼️' : '📄'
        console.log(`  ✅ ${imgStatus} [${article.score}pts] ${article.title.substring(0, 50)}`)
      } else {
        console.error('Insert error:', error.message)
      }
    }

    await supabase.from('fetch_logs').insert({
      status: 'success',
      articles_found: allArticles.length,
      articles_new: savedCount,
      articles_duplicate: newArticles.length - savedCount,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      summary: {
        sources_scanned: sources.length,
        total_scored: allArticles.length,
        new_stories: newArticles.length,
        saved: savedCount,
        backlog_rescored: previousBacklog?.length || 0,
        batch_id: currentBatchId,
        nepal_bonus_used: NEPAL_BONUS,
        sport_events_active: sportsEvents?.length || 0,
      },
    })

  } catch (err: any) {
    console.error('❌ Fetch error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ── Helper Functions ──

function extractBestImage(item: any): string | null {
  // 1. media:thumbnail (BBC - self closing with $ attributes)
  const mediaThumbnail = item.mediaThumbnail || item['media:thumbnail']
  if (mediaThumbnail) {
    if (Array.isArray(mediaThumbnail)) {
      const sorted = mediaThumbnail
        .filter((t: any) => t?.$?.url)
        .sort((a: any, b: any) =>
          (parseInt(b?.$?.width) || 0) - (parseInt(a?.$?.width) || 0)
        )
      const url = sorted[0]?.$?.url
      if (url && isValidImageUrl(url)) {
        // Upgrade BBC thumbnail to larger size
        return url.replace(/\/ace\/(standard|ws)\/\d+\//, '/ace/$1/1200/')
      }
    }
    const url = mediaThumbnail?.$?.url || mediaThumbnail?.url || mediaThumbnail
    if (typeof url === 'string' && isValidImageUrl(url)) {
      return url.replace(/\/ace\/(standard|ws)\/\d+\//, '/ace/$1/1200/')
    }
  }

  // 2. media:content (Al Jazeera, others)
  const mediaContent = item.mediaContent || item['media:content']
  if (mediaContent) {
    if (Array.isArray(mediaContent)) {
      const imgs = mediaContent.filter((m: any) =>
        m?.$?.medium === 'image' || m?.$?.type?.startsWith('image/')
      )
      const url = imgs[0]?.$?.url || mediaContent[0]?.$?.url
      if (url && isValidImageUrl(url)) return url
    }
    const url = mediaContent?.$?.url || mediaContent?.url || mediaContent
    if (typeof url === 'string' && isValidImageUrl(url)) return url
  }

  // 3. enclosure - image type only
  if (item.enclosure?.url && item.enclosure?.type?.startsWith('image/')) {
    if (isValidImageUrl(item.enclosure.url)) return item.enclosure.url
  }

  // 4. content:encoded (WordPress sites - OnlineKhabar, Kathmandu Post etc)
  const contentEncoded = item.contentEncoded || item['content:encoded'] || item.content || ''
  if (contentEncoded) {
    const match = contentEncoded.match(/<img[^>]+src=["']([^"']+)["']/i)
    if (match?.[1] && isValidImageUrl(match[1])) return match[1]
  }

  // 5. description HTML
  const descHtml = item.description || item.summary || ''
  if (descHtml) {
    const match = descHtml.match(/<img[^>]+src=["']([^"']+)["']/i)
    if (match?.[1] && isValidImageUrl(match[1])) return match[1]
  }

  return null
}

function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  if (url.startsWith('data:')) return false
  if (url.length < 10) return false
  return url.startsWith('http') || url.startsWith('//')
}

function deduplicateByTitle(articles: any[]): any[] {
  const sorted = [...articles].sort((a, b) => b.score - a.score)
  const seen = new Set<string>()
  const result = []
  for (const a of sorted) {
    const fp = a.title.toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter((w: string) => w.length > 4)
      .sort()
      .slice(0, 5)
      .join('|')
    if (!seen.has(fp)) {
      seen.add(fp)
      result.push(a)
    }
  }
  return result
}

function determineCategory(item: any, source: any): string {
  const t = (
    (item.title || '') + ' ' +
    (item.contentSnippet || item.description || '')
  ).toLowerCase()

  if (t.match(/election|government|parliament|minister|politics|party/)) return 'politics'
  if (t.match(/economy|business|trade|market|stock|bank|finance/)) return 'economy'
  if (t.match(/sport|football|cricket|ipl|game|player|match|champion/)) return 'sports'
  if (t.match(/tech|technology|internet|software|app|digital|ai/)) return 'tech'
  if (t.match(/health|medical|disease|hospital|doctor|covid/)) return 'health'
  if (t.match(/entertainment|movie|music|celebrity|film|actor/)) return 'entertainment'
  return source.category?.toLowerCase() || 'world'
}

async function detectRssFeed(url: string): Promise<string | null> {
  for (const p of ['/rss', '/rss.xml', '/feed', '/feed.xml', '/index.xml']) {
    try {
      const r = await fetch(url.replace(/\/$/, '') + p, {
        method: 'HEAD',
        signal: AbortSignal.timeout(4000),
      })
      if (r.ok) return url.replace(/\/$/, '') + p
    } catch {
      continue
    }
  }
  return null
}