export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import Parser from 'rss-parser'
import { supabase } from '@/app/lib/supabase'

const parser = new Parser({ timeout: 8000 })

// ── All free Google RSS sources — no API key needed ──
const TREND_SOURCES = [
  // Google Trends by country
  {
    name:     'Google Trends Nepal',
    url:      'https://trends.google.com/trends/trendingsearches/daily/rss?geo=NP',
    weight:   10,
    type:     'trends',
  },
  {
    name:     'Google Trends India',
    url:      'https://trends.google.com/trends/trendingsearches/daily/rss?geo=IN',
    weight:   8,
    type:     'trends',
  },
  {
    name:     'Google Trends Global',
    url:      'https://trends.google.com/trends/trendingsearches/daily/rss?geo=',
    weight:   7,
    type:     'trends',
  },
  // Google News by category
  {
    name:     'Google News Top Stories',
    url:      'https://news.google.com/rss?hl=en&gl=US&ceid=US:en',
    weight:   9,
    type:     'news',
  },
  {
    name:     'Google News Nepal',
    url:      'https://news.google.com/rss/search?q=Nepal&hl=en&gl=NP&ceid=NP:en',
    weight:   10,
    type:     'news',
  },
  {
    name:     'Google News World',
    url:      'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtVnVHZ0pPVkNnQVAB',
    weight:   8,
    type:     'news',
  },
  {
    name:     'Google News Sports',
    url:      'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNR1p1ZEdvU0FtVnVHZ0pPVkNnQVAB',
    weight:   8,
    type:     'news',
  },
  {
    name:     'Google News Business',
    url:      'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TXpvU0FtVnVHZ0pPVkNnQVAB',
    weight:   7,
    type:     'news',
  },
  {
    name:     'Google News Technology',
    url:      'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNR1F3Y25rU0FtVnVHZ0pPVkNnQVAB',
    weight:   7,
    type:     'news',
  },
  {
    name:     'Google News Science',
    url:      'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNR1ptZHpNU0FtVnVHZ0pPVkNnQVAB',
    weight:   6,
    type:     'news',
  },
]

// Words to ignore
const STOP_WORDS = new Set([
  'the','and','for','are','but','not','you','all','can','had','her',
  'was','one','our','out','day','get','has','him','his','how','may',
  'new','now','old','see','two','who','did','this','that','they',
  'will','with','have','from','been','more','when','your','what',
  'were','said','each','into','time','over','just','also','some',
  'news','says','amid','back','after','about','which','their',
  'these','those','other','then','than','could','would','there',
])

export async function POST() { return fetchTrends() }
export async function GET()  { return fetchTrends() }

async function fetchTrends() {
  console.log('🔥 Fetching real-time trends from Google...')

  // keyword → { score, sources, titles }
  const keywordMap = new Map<string, {
    score:   number
    sources: Set<string>
    titles:  string[]
  }>()

  let sourcesChecked = 0
  let sourcesWorking = 0

  for (const source of TREND_SOURCES) {
    try {
      const feed = await Promise.race([
        parser.parseURL(source.url),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 8000)
        ),
      ]) as Awaited<ReturnType<typeof parser.parseURL>>

      sourcesChecked++

      const items = feed.items || []
      if (!items.length) continue

      sourcesWorking++
      console.log(`  ✅ ${source.name}: ${items.length} items`)

      for (const item of items.slice(0, 20)) {
        const title = (item.title || '').replace(/<[^>]*>/g, '').trim()
        if (!title) continue

        if (source.type === 'trends') {
          // Google Trends: title = the exact trending search
          const cleaned = cleanTerm(title)
          if (cleaned.length > 2) {
            addKeyword(keywordMap, cleaned, source.name, source.weight, title)
            // Also add individual words from multi-word trends
            const words = cleaned.split(/\s+/)
            if (words.length > 1) {
              for (const w of words) {
                if (w.length > 3 && !STOP_WORDS.has(w.toLowerCase())) {
                  addKeyword(keywordMap, w, source.name, Math.round(source.weight * 0.6), title)
                }
              }
            }
          }
        } else {
          // Google News: extract meaningful keywords from headlines
          const keywords = extractFromHeadline(title)
          for (const kw of keywords) {
            addKeyword(keywordMap, kw, source.name, Math.round(source.weight * 0.7), title)
          }
        }
      }

    } catch (err: any) {
      sourcesChecked++
      console.log(`  ⚠️  ${source.name}: ${err.message}`)
    }
  }

  // ── Rank keywords ──
  const ranked = Array.from(keywordMap.entries())
    .map(([keyword, data]) => ({
      keyword,
      score:       data.score,
      sourceCount: data.sources.size,
      // Cross-source bonus: same topic in multiple sources = truly trending
      finalScore:  data.score + (data.sources.size * 8),
      sample:      data.titles[0] || '',
    }))
    .filter(k => k.keyword.length > 2 && k.finalScore > 5)
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, 40)

  console.log(`\n🔥 Top 10 trending right now:`)
  ranked.slice(0, 10).forEach((k, i) =>
    console.log(`  ${i + 1}. "${k.keyword}" (score: ${k.finalScore}, ${k.sourceCount} sources)`)
  )

  if (!ranked.length) {
    console.log('⚠️ No trends detected, keeping manual topics active')
    return NextResponse.json({
      success: true,
      message: 'No trends detected from Google, manual topics active',
      summary: { sources_checked: sourcesChecked, keywords_detected: 0 },
    })
  }

  // ── Save to DB: replace old auto-detected, keep manual ──
  await supabase
    .from('trending_topics')
    .delete()
    .eq('source', 'auto')

  const rows = ranked.map((k, i) => ({
    keyword:    k.keyword,
    keyword_ne: null,
    source:     'auto',
    // Top trending get highest priority
    priority:   i < 5 ? 10 : i < 15 ? 8 : i < 25 ? 6 : 5,
    is_active:  true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase.from('trending_topics').insert(rows)
  if (error) console.error('DB insert error:', error.message)

  return NextResponse.json({
    success: true,
    summary: {
      sources_checked:   sourcesChecked,
      sources_working:   sourcesWorking,
      keywords_detected: ranked.length,
      top_trending:      ranked.slice(0, 15).map(k => k.keyword),
    },
  })
}

// ── Helpers ──

function addKeyword(
  map:     Map<string, { score: number; sources: Set<string>; titles: string[] }>,
  keyword: string,
  source:  string,
  points:  number,
  title:   string
) {
  const key = keyword.toLowerCase().trim()
  if (!map.has(key)) {
    map.set(key, { score: 0, sources: new Set(), titles: [] })
  }
  const entry = map.get(key)!
  entry.score += points
  entry.sources.add(source)
  if (entry.titles.length < 3) entry.titles.push(title)
}

function extractFromHeadline(title: string): string[] {
  const results: string[] = []
  const words = title
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOP_WORDS.has(w.toLowerCase()))

  // Add individual meaningful words
  for (const w of words) {
    if (w.length > 3) results.push(w)
  }

  // Add 2-word phrases for named entities (e.g. "Gaza War", "IPL 2025")
  for (let i = 0; i < words.length - 1; i++) {
    const phrase = `${words[i]} ${words[i + 1]}`
    if (phrase.length > 5) results.push(phrase)
  }

  return results.slice(0, 6)
}

function cleanTerm(term: string): string {
  return term
    .replace(/<[^>]*>/g, '')
    .replace(/[^\w\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join(' ')
}
