export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

const FB_API        = 'https://graph.facebook.com/v19.0'
const PAGE_ID       = process.env.FACEBOOK_PAGE_ID!
const ACCESS_TOKEN  = process.env.FACEBOOK_PAGE_ACCESS_TOKEN!
const SITE_URL      = process.env.NEXT_PUBLIC_SITE_URL || 'https://nepali-news-portal-wheat.vercel.app'
const MAX_PER_DAY   = 20
const DELAY_MS      = 3000

export async function POST() {
  try {
    if (!PAGE_ID || !ACCESS_TOKEN) {
      return NextResponse.json({ error: 'Facebook credentials not configured' }, { status: 500 })
    }

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const { count: todayCount } = await supabase
      .from('facebook_logs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'success')
      .gte('posted_at', todayStart.toISOString())

    const remainingToday = MAX_PER_DAY - (todayCount || 0)

    if (remainingToday <= 0) {
      return NextResponse.json({
        success: true,
        message: `Daily limit of ${MAX_PER_DAY} posts reached. Will resume tomorrow.`,
        posted: 0,
      })
    }

    const { data: articles, error } = await supabase
      .from('articles')
      .select(`id, nepali_title, nepali_summary, image_url, published_at, categories ( name_ne, slug )`)
      .eq('status', 'published')
      .eq('facebook_posted', false)
      .not('nepali_title', 'is', null)
      .not('nepali_summary', 'is', null)
      .order('published_at', { ascending: false })
      .limit(remainingToday)

    if (error) throw error

    if (!articles || articles.length === 0) {
      return NextResponse.json({ success: true, message: 'No new articles to post', posted: 0 })
    }

    console.log(`📘 Posting ${articles.length} articles to Facebook...`)

    let successCount = 0
    let failCount    = 0
    const results    = []

    for (const article of articles) {
      try {
        const postId = await postToFacebook(article)

        await supabase
          .from('articles')
          .update({
            facebook_posted:    true,
            facebook_post_id:   postId,
            facebook_posted_at: new Date().toISOString(),
          })
          .eq('id', article.id)

        await supabase.from('facebook_logs').insert({
          article_id: article.id,
          post_id:    postId,
          status:     'success',
          posted_at:  new Date().toISOString(),
        })

        successCount++
        results.push({ id: article.id, title: article.nepali_title?.substring(0, 50), status: 'success' })
        await sleep(DELAY_MS)

      } catch (err: any) {
        failCount++
        await supabase.from('facebook_logs').insert({
          article_id: article.id,
          status:     'failed',
          error:      err.message,
          posted_at:  new Date().toISOString(),
        })
        results.push({ id: article.id, status: 'failed', error: err.message })
      }
    }

    return NextResponse.json({
      success: true,
      summary: { total: articles.length, posted: successCount, failed: failCount },
      results,
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET() {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data: todayLogs } = await supabase
    .from('facebook_logs')
    .select('*')
    .gte('posted_at', todayStart.toISOString())
    .order('posted_at', { ascending: false })

  const { count: pendingCount } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')
    .eq('facebook_posted', false)
    .not('nepali_title', 'is', null)

  return NextResponse.json({
    today_posted:     todayLogs?.filter(l => l.status === 'success').length || 0,
    today_failed:     todayLogs?.filter(l => l.status === 'failed').length  || 0,
    remaining_today:  Math.max(0, MAX_PER_DAY - (todayLogs?.filter(l => l.status === 'success').length || 0)),
    pending_articles: pendingCount || 0,
    recent_logs:      todayLogs?.slice(0, 10) || [],
  })
}

async function postToFacebook(article: any): Promise<string> {
  const articleUrl = `${SITE_URL}/news/${article.id}`
  const category   = article.categories?.name_ne || 'समाचार'
  const message    = formatPost(article.nepali_title, article.nepali_summary, category, articleUrl)

  let endpoint: string
  let body: Record<string, string>

  if (article.image_url && !article.image_url.includes('unsplash')) {
    endpoint = `${FB_API}/${PAGE_ID}/photos`
    body = { url: article.image_url, caption: message, access_token: ACCESS_TOKEN }
  } else {
    endpoint = `${FB_API}/${PAGE_ID}/feed`
    body = { message, link: articleUrl, access_token: ACCESS_TOKEN }
  }

  const response = await fetch(endpoint, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })

  const data = await response.json()
  if (!response.ok || data.error) throw new Error(data.error?.message || `Facebook API error: ${response.status}`)
  return data.id || 'unknown'
}

function formatPost(title: string, summary: string, category: string, url: string): string {
  const shortSummary = summary?.length > 200 ? summary.substring(0, 200) + '...' : summary || ''
  return `🔴 ${category.toUpperCase()} | ताजा समाचार\n\n📰 ${title}\n\n${shortSummary}\n\n📖 पूरा समाचार पढ्नुहोस्:\n${url}\n\n#GNNepal #नेपालीसमाचार #ताजाखबर`
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
