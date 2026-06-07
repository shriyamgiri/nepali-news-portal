export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  return handleCron(request)
}

export async function POST(request: Request) {
  return handleCron(request)
}

async function handleCron(request: Request) {
  try {
    console.log('⏰ Cron job triggered')

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nepali-news-portal-wheat.vercel.app'

    // ── Step 1: Fetch news ──
    console.log('📰 Step 1: Fetching news...')
    const fetchRes  = await fetch(`${baseUrl}/api/fetch-news`, { method: 'POST' })
    const fetchData = await fetchRes.json()
    console.log('✅ Fetch completed:', fetchData.summary || fetchData)

    // ── Step 2: Translate ──
    console.log('\n🌐 Step 2: Translating articles...')
    const translateRes  = await fetch(`${baseUrl}/api/translate`, { method: 'POST' })
    const translateData = await translateRes.json()
    console.log('✅ Translation completed:', translateData.summary || translateData)

    // ── Step 3: Post to Facebook ──
    console.log('\n📘 Step 3: Posting to Facebook...')
    let facebookData = { summary: { posted: 0 }, skipped: false }

    const fbPageId    = process.env.FACEBOOK_PAGE_ID
    const fbPageToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN

    if (fbPageId && fbPageToken) {
      const fbRes  = await fetch(`${baseUrl}/api/facebook/post`, { method: 'POST' })
      facebookData = await fbRes.json()
      console.log('✅ Facebook posting completed:', facebookData.summary || facebookData)
    } else {
      facebookData.skipped = true
      console.log('⚠️  Facebook credentials not set — skipping')
    }

    return NextResponse.json({
      success: true,
      steps: {
        fetch:     fetchData.summary     || fetchData,
        translate: translateData.summary || translateData,
        facebook:  facebookData.skipped
          ? 'Skipped — credentials not configured'
          : facebookData.summary || facebookData,
      },
    })

  } catch (error: any) {
    console.error('❌ Cron error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}