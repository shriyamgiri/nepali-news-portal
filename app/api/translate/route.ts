export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { supabase } from '@/app/lib/supabase'

// ── Production config ──
const genAI         = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const PRIMARY_MODEL = 'gemini-2.5-flash'    // 1500 req/day FREE
const BACKUP_MODEL  = 'gemini-1.5-flash' // fallback if primary fails
const BATCH_SIZE    = 10   // safe batch for free tier
const DELAY_MS      = 2000 // 2s between articles

export async function POST() {
  try {
    console.log('🌐 Translation pipeline starting...')

    // ── Reset any stuck articles first ──
    const { count: stuckCount } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'translating')
      .lt('updated_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()) // stuck > 10 mins

    if (stuckCount && stuckCount > 0) {
      await supabase
        .from('articles')
        .update({ status: 'fetched' })
        .eq('status', 'translating')
        .lt('updated_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
      console.log(`🔧 Reset ${stuckCount} stuck articles`)
    }

    // ── Get articles pending translation ──
    const { data: articles, error } = await supabase
      .from('articles')
      .select('*')
      .eq('status', 'fetched')
      .is('nepali_title', null)
      .order('published_at', { ascending: false })
      .limit(BATCH_SIZE)

    if (error) throw new Error(`DB fetch failed: ${error.message}`)

    if (!articles?.length) {
      return NextResponse.json({
        success: true,
        message: 'No articles pending translation',
        translated: 0,
      })
    }

    console.log(`📝 Translating ${articles.length} articles...`)

    let successCount = 0
    let failCount    = 0
    const results    = []

    for (const article of articles) {
      const startTime = Date.now()
      console.log(`\n🔄 [${articles.indexOf(article) + 1}/${articles.length}] ${article.original_title?.substring(0, 50)}`)

      try {
        // Mark as translating with timestamp
        await supabase
          .from('articles')
          .update({ status: 'translating', updated_at: new Date().toISOString() })
          .eq('id', article.id)

        // Try primary model first, fallback to backup
        const translated = await translateWithFallback(
          article.original_title,
          article.original_summary || article.original_content?.substring(0, 800) || '',
          article.original_content || ''
        )

        const duration = Date.now() - startTime

        // Save translation
        const { error: updateError } = await supabase
          .from('articles')
          .update({
            nepali_title:   translated.title,
            nepali_summary: translated.summary,
            nepali_content: translated.content,
            status:         'published',
            translated_at:  new Date().toISOString(),
            updated_at:     new Date().toISOString(),
          })
          .eq('id', article.id)

        if (updateError) throw new Error(`DB update failed: ${updateError.message}`)

        // Log success
        await supabase.from('translation_logs').insert({
          article_id:              article.id,
          model_used:              PRIMARY_MODEL,
          source_language:         article.original_language || 'en',
          target_language:         'ne',
          status:                  'success',
          translation_duration_ms: duration,
        })

        successCount++
        console.log(`   ✅ Done in ${duration}ms`)
        results.push({ id: article.id, status: 'success', duration: `${duration}ms` })

      } catch (err: any) {
        failCount++
        console.error(`   ❌ Failed: ${err.message}`)

        // Reset to fetched for retry next cycle
        await supabase
          .from('articles')
          .update({ status: 'fetched', updated_at: new Date().toISOString() })
          .eq('id', article.id)

        await supabase.from('translation_logs').insert({
          article_id:      article.id,
          model_used:      PRIMARY_MODEL,
          source_language: article.original_language || 'en',
          target_language: 'ne',
          status:          'failed',
          error_message:   err.message,
        })

        results.push({ id: article.id, status: 'failed', error: err.message })
      }

      // Delay between articles
      if (articles.indexOf(article) < articles.length - 1) {
        await sleep(DELAY_MS)
      }
    }

    console.log(`\n✅ Batch complete: ${successCount} success, ${failCount} failed`)

    return NextResponse.json({
      success: true,
      summary: {
        total_processed: articles.length,
        successful:      successCount,
        failed:          failCount,
        stuck_reset:     stuckCount || 0,
      },
      results,
    })

  } catch (err: any) {
    console.error('❌ Translation pipeline error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ── Translate with primary model, fallback to backup ──
async function translateWithFallback(
  title: string,
  summary: string,
  content: string
): Promise<{ title: string; summary: string; content: string }> {

  // Try primary model
  try {
    return await callGemini(PRIMARY_MODEL, title, summary, content)
  } catch (primaryErr: any) {
    const is429 = primaryErr.message?.includes('429') || primaryErr.message?.includes('quota')

    if (is429) {
      console.log(`   ⚠️ Primary model quota hit, trying backup model...`)
      // Wait before trying backup
      await sleep(5000)
      try {
        return await callGemini(BACKUP_MODEL, title, summary, content)
      } catch (backupErr: any) {
        console.error(`   ❌ Backup model also failed: ${backupErr.message}`)
        throw new Error(`Both models failed. Primary: ${primaryErr.message}`)
      }
    }

    throw primaryErr
  }
}

// ── Call Gemini with retry ──
async function callGemini(
  modelName: string,
  title: string,
  summary: string,
  content: string,
  retries = 2
): Promise<{ title: string; summary: string; content: string }> {

  const model  = genAI.getGenerativeModel({ model: modelName })
  const prompt = buildPrompt(title, summary, content)

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const result   = await model.generateContent(prompt)
      const response = await result.response
      const text     = response.text()
      return parseResponse(text)

    } catch (err: any) {
      const is429   = err.message?.includes('429') || err.message?.includes('quota')
      const isLast  = attempt === retries + 1

      if (isLast) throw err

      // Extract wait time from error or use exponential backoff
      const retryMatch = err.message?.match(/retry in (\d+)/)
      const waitSecs   = retryMatch ? parseInt(retryMatch[1]) + 2 : attempt * 10

      console.log(`   ⏳ Attempt ${attempt} failed${is429 ? ' (rate limit)' : ''}. Waiting ${waitSecs}s...`)
      await sleep(waitSecs * 1000)
    }
  }

  throw new Error('Max retries exceeded')
}

// ── Build translation prompt ──
function buildPrompt(title: string, summary: string, content: string): string {
  const text = content.length > 200 ? content : (summary || content)
  const truncated = text.substring(0, 1500) // limit tokens

  return `You are a professional Nepali news journalist. Translate this news article to formal Nepali.

RULES:
1. Keep proper nouns AS-IS: names (Trump, Modi, Sharma), places (Delhi, London, Kathmandu), organizations (UN, BBC, NASA), countries
2. Use formal journalistic Nepali (पत्रकारिता शैली)
3. Be factually accurate — do NOT add or change any information
4. If content is short, expand to 3 paragraphs using available facts
5. Keep numbers and dates in original form

ARTICLE:
Title: ${title}
Content: ${truncated}

Respond ONLY with this JSON (no other text, no markdown):
{"title":"nepali title here","summary":"2-3 sentence nepali summary","content":"3-4 paragraph nepali content separated by \\n\\n"}`
}

// ── Parse AI response ──
function parseResponse(text: string): { title: string; summary: string; content: string } {
  let clean = text.trim()
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  // Sometimes model adds text before/after JSON
  const jsonMatch = clean.match(/\{[\s\S]*\}/)
  if (jsonMatch) clean = jsonMatch[0]

  const parsed = JSON.parse(clean)

  if (!parsed.title) throw new Error('No title in translation response')

  return {
    title:   parsed.title   || '',
    summary: parsed.summary || '',
    content: parsed.content || parsed.summary || '',
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}