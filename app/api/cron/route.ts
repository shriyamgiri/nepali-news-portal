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
    console.log('⏰ Cron job triggered - Fetching news...')
    
    // Call our fetch-news API
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/fetch-news`, {
      method: 'POST',
    })

    const data = await response.json()

    console.log('✅ Cron fetch completed:', data)

    return NextResponse.json({
      success: true,
      message: 'News fetch triggered successfully',
      data,
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