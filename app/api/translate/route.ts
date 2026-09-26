export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { supabaseAdmin as supabase } from '@/app/lib/supabase'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const MODEL_PRIMARY = 'gemini-2.5-flash'
const MODEL_BACKUP = 'gemini-2.5-flash-lite'
const BATCH_SIZE = 3
const DELAY_MS = 200
const TIMEOUT_MS = 15000

export async function POST() {
  try {
    // Reset stuck articles (stuck > 10 mins)
    await supabase
      .from('articles')
      .update({ status: 'fetched', updated_at: new Date().toISOString() })
      .eq('status', 'translating')
      .lt('updated_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())

    // ── Get TOP articles by priority_score ──
    // This picks best from BOTH current and previous batch combined
    const { data: articles, error } = await supabase
      .from('articles')
      .select('*')
      .eq('status', 'fetched')
      .is('nepali_title', null)
      .order('priority_score', { ascending: false }) // ← Highest score first
      .order('published_at', { ascending: false }) // ← Then newest
      .limit(BATCH_SIZE)

    if (error) throw new Error(`DB error: ${error.message}`)

    if (!articles?.length) {
      return NextResponse.json({
        success: true,
        message: 'No articles pending translation',
        translated: 0,
      })
    }

    console.log(`📝 Translating TOP ${articles.length} articles by priority score...`)
    articles.forEach((a, i) => {
      console.log(`  ${i + 1}. [Score: ${a.priority_score}] ${a.original_title?.substring(0, 50)}`)
    })

    let successCount = 0
    let failCount = 0
    const results = []

    for (const article of articles) {
      const start = Date.now()
      console.log(`\n🔄 ${article.original_title?.substring(0, 55)}`)

      try {
        // Mark as in-progress
        await supabase
          .from('articles')
          .update({ status: 'translating', updated_at: new Date().toISOString() })
          .eq('id', article.id)

        // 15 second timeout per article
        const translated = await Promise.race([
          translateWithFallback(
            article.original_title || '',
            article.original_summary || '',
            article.original_content || ''
          ),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error('Translation timeout after 15s')),
              TIMEOUT_MS
            )
          )
        ])

        const { error: updateError } = await supabase
          .from('articles')
          .update({
            nepali_title: translated.title,
            nepali_summary: translated.summary,
            nepali_content: translated.content,
            status: 'published',
            translated_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', article.id)

        if (updateError) throw new Error(`DB update failed: ${updateError.message}`)

        await supabase.from('translation_logs').insert({
          article_id: article.id,
          model_used: MODEL_PRIMARY,
          source_language: article.original_language || 'en',
          target_language: 'ne',
          status: 'success',
          translation_duration_ms: Date.now() - start,
        })

        successCount++
        console.log(`  ✅ Done (${Date.now() - start}ms) [Score: ${article.priority_score}]`)
        results.push({
          id: article.id,
          status: 'success',
          score: article.priority_score,
          duration: `${Date.now() - start}ms`,
        })

      } catch (err: any) {
        failCount++
        console.error(`  ❌ ${err.message}`)

        // Reset back to fetched for retry
        await supabase
          .from('articles')
          .update({ status: 'fetched', updated_at: new Date().toISOString() })
          .eq('id', article.id)

        await supabase.from('translation_logs').insert({
          article_id: article.id,
          model_used: MODEL_PRIMARY,
          source_language: article.original_language || 'en',
          target_language: 'ne',
          status: 'failed',
          error_message: err.message,
        })

        results.push({
          id: article.id,
          status: 'failed',
          error: err.message,
        })
      }

      await sleep(DELAY_MS)
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: articles.length,
        successful: successCount,
        failed: failCount,
      },
      results,
    })

  } catch (err: any) {
    console.error('❌ Translation error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

async function translateWithFallback(title: string, summary: string, content: string) {
  try {
    return await callModel(MODEL_PRIMARY, title, summary, content)
  } catch (e: any) {
    const isQuota = e.message?.includes('429') || e.message?.includes('quota')
    if (isQuota) {
      console.log(`  ⚠️ Quota hit, trying ${MODEL_BACKUP}...`)
      await sleep(3000)
      return await callModel(MODEL_BACKUP, title, summary, content)
    }
    throw e
  }
}

// ── Nepali vocabulary glossary ──
// Add to this list every time a bad/non-standard word choice is spotted in
// published articles. This is the fastest way to permanently fix recurring
// mistranslations without waiting for a model update.
const NEPALI_GLOSSARY = `
शब्दावली (यी शब्दहरू सधैं यसरी नै लेख्नुहोस्, अरू रूपमा होइन):
- international → अन्तर्राष्ट्रिय (राष्ट्रसंघीय, अन्तर्देशीय, वा अन्य कुनै रूप प्रयोग नगर्नुहोस्)
- United Nations → संयुक्त राष्ट्रसंघ
- government → सरकार
- minister → मन्त्री
- prime minister → प्रधानमन्त्री
- president → राष्ट्रपति
- parliament → संसद
- election → निर्वाचन
- economy → अर्थतन्त्र
- earthquake → भूकम्प
- flood → बाढी
- police → प्रहरी
- army → सेना
`.trim()

async function callModel(
  modelName: string,
  title: string,
  summary: string,
  content: string,
  retries = 1
) {
  const model = genAI.getGenerativeModel({ model: modelName })
  const source = summary || content.substring(0, 300)

  const prompt = `You are a professional Nepali news journalist working for a Nepal-based news outlet. Translate this article into formal, standard NEPALI (not Hindi, not a mix of Hindi-Nepali).

CRITICAL LANGUAGE RULES:
1. Write in pure, standard NEPALI as used by Nepali newspapers (Kantipur, Nagarik, Setopati style) — NOT Hindi. Do not use Hindi vocabulary, Hindi spellings, or Hindi-style sentence construction, even if the words look similar.
2. Use commonly understood, everyday Nepali journalism vocabulary. Avoid obscure, overly literal, archaic, or Sanskrit-heavy word choices when a simpler, standard word is used in real Nepali news reporting.
3. Follow this glossary EXACTLY for these recurring terms — do not substitute alternate translations:
${NEPALI_GLOSSARY}
4. Keep all proper nouns (person names, place names, organization names) transliterated consistently into Nepali script — e.g. Trump → ट्रम्प, Biden → बाइडेन. Never literally translate a person's name, and never change the spelling between different articles.
5. Do NOT add or change any facts, numbers, dates, or quotes from the original.
6. Expand short content to 3 paragraphs using only the facts available — do not invent new information.

Title: ${title}
Content: ${source.substring(0, 500)}

Reply ONLY with JSON (no markdown):
{"title":"nepali title","summary":"2-3 sentence nepali summary","content":"3-4 paragraph nepali content separated by \\n\\n"}`

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const result = await model.generateContent(prompt)
      const text = result.response.text()
      return parseJSON(text)
    } catch (e: any) {
      if (attempt > retries) throw e
      await sleep(attempt * 3000)
    }
  }
  throw new Error('Max retries exceeded')
}

function parseJSON(text: string) {
  let clean = text.trim()
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  const match = clean.match(/\{[\s\S]*\}/)
  if (match) clean = match[0]

  const p = JSON.parse(clean)
  if (!p.title) throw new Error('No title in response')

  return {
    title: p.title,
    summary: p.summary || '',
    content: p.content || p.summary || '',
  }
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}