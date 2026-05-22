export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { supabase } from '@/app/lib/supabase'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

// ── Retry with exponential backoff for 429 errors ──
async function translateWithRetry(
  prompt: string,
  maxRetries: number = 3
): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result   = await model.generateContent(prompt)
      const response = await result.response
      return response.text()
    } catch (error: any) {
      const is429     = error.message?.includes('429') || error.message?.includes('quota')
      const isLast    = attempt === maxRetries

      if (is429) {
        // Extract retry delay from error message if available
        const retryMatch = error.message?.match(/retry in (\d+)/)
        const waitSecs   = retryMatch ? parseInt(retryMatch[1]) + 5 : attempt * 15

        console.log(`   ⚠️  Rate limit hit (attempt ${attempt}/${maxRetries}). Waiting ${waitSecs}s...`)

        if (isLast) throw error
        await sleep(waitSecs * 1000)
      } else {
        if (isLast) throw error
        await sleep(3000 * attempt)
      }
    }
  }
  throw new Error('Max retries exceeded')
}

export async function POST(request: Request) {
  try {
    console.log('🌐 Starting translation process...')

    // ✅ Reduced batch to 5 — avoids hitting 20 req/day limit too fast
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('*')
      .eq('status', 'fetched')
      .is('nepali_title', null)
      .limit(5)

    if (articlesError) {
      return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 })
    }

    if (!articles || articles.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No articles pending translation',
        translated: 0,
      })
    }

    console.log(`📝 Found ${articles.length} articles to translate`)

    let successCount = 0
    let failCount    = 0
    const results    = []

    for (const article of articles) {
      console.log(`\n🔄 Translating: ${article.original_title.substring(0, 60)}...`)
      const startTime = Date.now()

      try {
        // Mark as translating
        await supabase
          .from('articles')
          .update({ status: 'translating' })
          .eq('id', article.id)

        const prompt = createTranslationPrompt(
          article.original_title,
          article.original_summary || article.original_content?.substring(0, 500) || '',
          article.original_content || ''
        )

        // ✅ Use retry logic instead of direct call
        const translatedText = await translateWithRetry(prompt)
        const translated     = parseTranslationResponse(translatedText)

        if (!translated.title) throw new Error('No title returned from translation')

        const duration = Date.now() - startTime

        await supabase
          .from('articles')
          .update({
            nepali_title:   translated.title,
            nepali_summary: translated.summary,
            nepali_content: translated.content || translated.summary,
            status:         'published',
            translated_at:  new Date().toISOString(),
          })
          .eq('id', article.id)

        await supabase.from('translation_logs').insert({
          article_id:             article.id,
          model_used:             'gemini-2.5-flash',
          source_language:        article.original_language,
          target_language:        'ne',
          status:                 'success',
          translation_duration_ms: duration,
        })

        successCount++
        console.log(`   ✅ Done (${duration}ms)`)

        results.push({
          article_id:   article.id,
          nepali_title: translated.title.substring(0, 60),
          duration:     `${duration}ms`,
          status:       'success',
        })

      } catch (error: any) {
        failCount++
        console.error(`   ❌ Failed:`, error.message)

        // Reset to fetched so it retries next run
        await supabase
          .from('articles')
          .update({ status: 'fetched' })
          .eq('id', article.id)

        await supabase.from('translation_logs').insert({
          article_id:      article.id,
          model_used:      'gemini-2.5-flash',
          source_language: article.original_language,
          target_language: 'ne',
          status:          'failed',
          error_message:   error.message,
        })

        results.push({
          article_id: article.id,
          error:      error.message,
          status:     'failed',
        })
      }

      // ✅ 3 second delay between articles to respect rate limits
      await sleep(3000)
    }

    return NextResponse.json({
      success: true,
      summary: {
        total_processed: articles.length,
        successful:      successCount,
        failed:          failCount,
      },
      results,
    })

  } catch (error: any) {
    console.error('❌ Translation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function createTranslationPrompt(title: string, summary: string, content: string): string {
  const sourceText = content || summary
  return `You are a professional Nepali news translator. Translate the following news article to Nepali.

CRITICAL INSTRUCTIONS:
1. Keep all proper nouns in ORIGINAL form (names of people, places, organizations, countries)
2. Use formal Nepali news writing style (पत्रकारिता शैली)
3. Maintain factual accuracy - do NOT add or remove information
4. Use neutral, journalistic tone
5. Keep numbers in their original form
6. If content is short, expand to 3-4 detailed paragraphs while staying factual
7. Translate dates and times appropriately

ARTICLE TO TRANSLATE:
Title: ${title}
Content: ${sourceText}

Return ONLY a JSON object:
{
  "title": "translated title in Nepali",
  "summary": "translated summary in Nepali (2-3 sentences)",
  "content": "full detailed content in Nepali (3-5 paragraphs separated by \\n\\n)"
}

Respond with ONLY the JSON, no other text.`
}

function parseTranslationResponse(responseText: string): {
  title: string; summary: string; content?: string
} {
  try {
    let clean = responseText.trim()
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
    const parsed = JSON.parse(clean)
    return {
      title:   parsed.title   || '',
      summary: parsed.summary || '',
      content: parsed.content || parsed.summary || '',
    }
  } catch {
    throw new Error('Invalid translation response format')
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}