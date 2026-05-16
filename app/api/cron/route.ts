import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron (in production)
  const authHeader = request.headers.get('authorization')
  
  // In development, allow all requests
  // In production, check for Vercel cron secret
  if (process.env.NODE_ENV === 'production') {
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    console.log('⏰ Cron job triggered')
    
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    
    // Step 1: Fetch news
    console.log('📰 Step 1: Fetching news...')
    const fetchResponse = await fetch(`${baseUrl}/api/fetch-news`, {
      method: 'POST',
    })
    const fetchData = await fetchResponse.json()
    console.log('✅ Fetch completed:', fetchData.summary)

    // Step 2: Translate articles
    console.log('\n🌐 Step 2: Translating articles...')
    const translateResponse = await fetch(`${baseUrl}/api/translate`, {
      method: 'POST',
    })
    const translateData = await translateResponse.json()
    console.log('✅ Translation completed:', translateData.summary)

    return NextResponse.json({
      success: true,
      message: 'Automated news pipeline completed',
      fetch: fetchData.summary,
      translate: translateData.summary,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('❌ Cron error:', error)
    return NextResponse.json(
      { error: error.message, timestamp: new Date().toISOString() },
      { status: 500 }
    )
  }
}