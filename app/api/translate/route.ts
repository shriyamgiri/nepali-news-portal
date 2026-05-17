import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { supabase } from '@/app/lib/supabase'

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

export async function POST(request: Request) {
  try {
    console.log('🌐 Starting translation process...')

    // Get untranslated articles from database
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('*')
      .eq('status', 'fetched')
      .is('nepali_title', null)
      .limit(10) // Process 10 at a time

    if (articlesError) {
      console.error('Error fetching articles:', articlesError)
      return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 })
    }

    if (!articles || articles.length === 0) {
      console.log('✅ No articles to translate')
      return NextResponse.json({ 
        success: true, 
        message: 'No articles pending translation',
        translated: 0 
      })
    }

    console.log(`📝 Found ${articles.length} articles to translate`)

    let successCount = 0
    let failCount = 0
    const translationResults = []

    // Process each article
    for (const article of articles) {
      console.log(`\n🔄 Translating: ${article.original_title.substring(0, 50)}...`)
      
      const startTime = Date.now()

      try {
        // Update status to 'translating'
        await supabase
          .from('articles')
          .update({ status: 'translating' })
          .eq('id', article.id)

        // Create the translation prompt
        const prompt = createTranslationPrompt(
          article.original_title,
          article.original_summary || article.original_content?.substring(0, 500) || '',
          article.original_content || ''
        )

        // Call Gemini API
        const result = await model.generateContent(prompt)
        const response = await result.response
        const translatedText = response.text()

        // Parse the response (expecting JSON format)
        const translated = parseTranslationResponse(translatedText)

        if (!translated.title) {
          throw new Error('Translation failed - no title returned')
        }

        const duration = Date.now() - startTime

        // Update article with translation
        const { error: updateError } = await supabase
          .from('articles')
          .update({
            nepali_title: translated.title,
            nepali_summary: translated.summary,
            nepali_content: translated.content || translated.summary,
            status: 'published', // Mark as published
            translated_at: new Date().toISOString(),
          })
          .eq('id', article.id)

        if (updateError) {
          throw updateError
        }

        // Log translation success
        await supabase.from('translation_logs').insert({
          article_id: article.id,
          model_used: 'gemini-1.5-flash',
          source_language: article.original_language,
          target_language: 'ne',
          status: 'success',
          translation_duration_ms: duration,
        })

        successCount++
        console.log(`   ✅ Success (${duration}ms)`)

        translationResults.push({
          article_id: article.id,
          original_title: article.original_title.substring(0, 50),
          nepali_title: translated.title.substring(0, 50),
          duration: `${duration}ms`,
          status: 'success',
        })

      } catch (error: any) {
        failCount++
        console.error(`   ❌ Error:`, error.message)

        // Update status back to 'fetched' so it can be retried
        await supabase
          .from('articles')
          .update({ status: 'fetched' })
          .eq('id', article.id)

        // Log translation failure
        await supabase.from('translation_logs').insert({
          article_id: article.id,
          model_used: 'gemini-1.5-flash',
          source_language: article.original_language,
          target_language: 'ne',
          status: 'failed',
          error_message: error.message,
        })

        translationResults.push({
          article_id: article.id,
          original_title: article.original_title.substring(0, 50),
          error: error.message,
          status: 'failed',
        })
      }

      // Small delay to avoid rate limiting
      await sleep(500)
    }

    console.log('\n✅ Translation batch completed!')
    console.log(`📊 Success: ${successCount} | Failed: ${failCount}`)

    return NextResponse.json({
      success: true,
      summary: {
        total_processed: articles.length,
        successful: successCount,
        failed: failCount,
      },
      results: translationResults,
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
6. If the content is short (only summary), expand it to 3-4 detailed paragraphs while staying factual
7. Translate dates and times appropriately

Examples of proper nouns to KEEP AS-IS:
- Names: Donald Trump, Joe Biden, Narendra Modi
- Places: Washington, Delhi, Kathmandu
- Organizations: UN, WHO, BBC, NASA
- Countries: America, India, China

ARTICLE TO TRANSLATE:

Title: ${title}

Content: ${sourceText}

Return ONLY a JSON object with this exact format:
{
  "title": "translated title in Nepali",
  "summary": "translated summary in Nepali (2-3 sentences)",
  "content": "full detailed content in Nepali (3-5 paragraphs, each separated by \\n\\n)"
}

Respond with ONLY the JSON object, no other text.`
}

// Parse the AI response
function parseTranslationResponse(responseText: string): {
  title: string
  summary: string
  content?: string
} {
  try {
    // Remove markdown code blocks if present
    let cleanText = responseText.trim()
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/```\n?/g, '')
    }

    const parsed = JSON.parse(cleanText)
    return {
      title: parsed.title || '',
      summary: parsed.summary || '',
      content: parsed.content || parsed.summary || '',
    }
  } catch (error) {
    console.error('Failed to parse translation response:', responseText)
    throw new Error('Invalid translation response format')
  }
}

// Helper function for delay
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}