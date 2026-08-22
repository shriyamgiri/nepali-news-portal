export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://nepali-news-portal-wheat.vercel.app'

export async function GET()  { return runPipeline() }
export async function POST() { return runPipeline() }

async function runPipeline() {
  const startTime = Date.now()
  console.log(`\n${'='.repeat(50)}`)
  console.log(`⏰ GN Nepal Pipeline: ${new Date().toISOString()}`)
  console.log('='.repeat(50))

  const results: Record<string, any> = {}

  // ── Step 1: Auto-detect trending topics ──
  console.log('\n📊 Step 1: Detecting trending topics...')
  try {
    const res  = await fetch(`${SITE_URL}/api/trending/auto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await res.json()
    results.trending = data.summary || data
    console.log(`✅ Trending: ${data.summary?.keywords_detected || 0} keywords`)
  } catch (err: any) {
    results.trending = { error: err.message }
    console.error('⚠️ Trending failed (non-critical):', err.message)
  }

  // ── Step 2: Smart fetch news ──
  console.log('\n📰 Step 2: Fetching news...')
  try {
    const res  = await fetch(`${SITE_URL}/api/fetch-news`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await res.json()
    results.fetch = data.summary || data
    console.log(`✅ Fetch: ${data.summary?.saved || 0} articles saved`)
  } catch (err: any) {
    results.fetch = { error: err.message }
    console.error('❌ Fetch failed:', err.message)
  }

  // ── Step 3: Translate ──
  console.log('\n🌐 Step 3: Translating...')
  try {
    const res  = await fetch(`${SITE_URL}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await res.json()
    results.translate = data.summary || data
    console.log(`✅ Translation: ${data.summary?.successful || 0} articles`)
  } catch (err: any) {
    results.translate = { error: err.message }
    console.error('❌ Translation failed:', err.message)
  }

  // ── Step 4: Post to Facebook ──
  console.log('\n📘 Step 4: Facebook posting...')
  try {
    const res  = await fetch(`${SITE_URL}/api/facebook/post`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await res.json()
    results.facebook = data.summary || data.message
    console.log(`✅ Facebook: ${data.summary?.posted || 0} posted`)
  } catch (err: any) {
    results.facebook = { error: err.message }
    console.error('⚠️ Facebook failed (non-critical):', err.message)
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`\n✅ Pipeline complete in ${duration}s`)

  return NextResponse.json({
    success:   true,
    duration:  `${duration}s`,
    timestamp: new Date().toISOString(),
    steps:     results,
  })
}