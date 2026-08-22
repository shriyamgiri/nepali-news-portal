export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://nepali-news-portal-wheat.vercel.app'
const CRON_SECRET = process.env.CRON_SECRET || ''

// Helper to make authenticated internal calls
async function internalCall(path: string, method = 'POST') {
  const res = await fetch(`${SITE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-cron-secret': CRON_SECRET,
    },
  })
  return res.json()
}

export async function GET()  { return runPipeline() }
export async function POST() { return runPipeline() }

async function runPipeline() {
  const startTime = Date.now()
  console.log(`⏰ GN Nepal Pipeline: ${new Date().toISOString()}`)

  const results: Record<string, any> = {}

  // Step 1: Trending topics
  try {
    const data = await internalCall('/api/trending/auto')
    results.trending = data.summary || data
    console.log(`✅ Trending: ${data.summary?.keywords_detected || 0} keywords`)
  } catch (err: any) {
    results.trending = { error: err.message }
    console.error('⚠️ Trending failed:', err.message)
  }

  // Step 2: Fetch news
  try {
    const data = await internalCall('/api/fetch-news')
    results.fetch = data.summary || data
    console.log(`✅ Fetch: ${data.summary?.saved || 0} articles saved`)
  } catch (err: any) {
    results.fetch = { error: err.message }
    console.error('❌ Fetch failed:', err.message)
  }

  // Step 3: Translate
  try {
    const data = await internalCall('/api/translate')
    results.translate = data.summary || data
    console.log(`✅ Translation: ${data.summary?.successful || 0} articles`)
  } catch (err: any) {
    results.translate = { error: err.message }
    console.error('❌ Translation failed:', err.message)
  }

  // Step 4: Facebook
  try {
    const data = await internalCall('/api/facebook/post')
    results.facebook = data.summary || data.message
    console.log(`✅ Facebook: ${data.summary?.posted || 0} posted`)
  } catch (err: any) {
    results.facebook = { error: err.message }
    console.error('⚠️ Facebook failed:', err.message)
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`✅ Pipeline complete in ${duration}s`)

  return NextResponse.json({
    success:   true,
    duration:  `${duration}s`,
    timestamp: new Date().toISOString(),
    steps:     results,
  })
}