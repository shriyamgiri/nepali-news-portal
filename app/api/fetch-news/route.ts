export const dynamic = 'force-dynamic'  // ← Add this as first line

import { NextResponse } from 'next/server'
import Parser from 'rss-parser'
import { supabase } from '@/app/lib/supabase'

const parser = new Parser()

export async function POST(request: Request) {
  try {
    console.log('🚀 Starting news fetch...')

    // Get all active sources from database
    const { data: sources, error: sourcesError } = await supabase
      .from('sources')
      .select('*')
      .eq('is_active', true)

    if (sourcesError) {
      console.error('Error fetching sources:', sourcesError)
      return NextResponse.json({ error: 'Failed to fetch sources' }, { status: 500 })
    }

    if (!sources || sources.length === 0) {
      return NextResponse.json({ message: 'No active sources found' }, { status: 200 })
    }

    console.log(`📡 Found ${sources.length} active sources`)

    let totalFetched = 0
    let totalNew = 0
    let totalDuplicate = 0
    const fetchResults = []

    // Process each source
    for (const source of sources) {
      console.log(`\n📰 Processing: ${source.name}`)
      
      const startTime = Date.now()
      let articlesFound = 0
      let articlesNew = 0
      let articlesDuplicate = 0

      try {
        // Try to fetch RSS feed
        let feedUrl = source.rss_feed_url

        // If no RSS URL, try to auto-detect common patterns
        if (!feedUrl) {
          feedUrl = await detectRssFeed(source.website_url)
        }

        if (!feedUrl) {
          console.log(`⚠️  No RSS feed found for ${source.name}`)
          
          // Log the failed fetch
          await supabase.from('fetch_logs').insert({
            source_id: source.id,
            status: 'failed',
            error_message: 'No RSS feed URL found',
            articles_found: 0,
            articles_new: 0,
            articles_duplicate: 0,
            started_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
          })
          
          continue
        }

        // Parse the RSS feed
        console.log(`🔍 Fetching from: ${feedUrl}`)
        const feed = await parser.parseURL(feedUrl)
        articlesFound = feed.items.length
        console.log(`   Found ${articlesFound} articles`)

        // Process each article
        for (const item of feed.items) {
          // Check if article already exists (by original URL)
          const { data: existing } = await supabase
            .from('articles')
            .select('id')
            .eq('original_url', item.link || '')
            .single()

          if (existing) {
            articlesDuplicate++
            continue // Skip duplicate
          }

          // Determine category based on source category or content
          const categorySlug = await determineCategory(item, source)
          const { data: category } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', categorySlug)
            .single()

          // Extract image from content if available
          const imageUrl = extractImageUrl(item.content || item.description || '')

          // Insert new article
          const { error: insertError } = await supabase
            .from('articles')
            .insert({
              source_id: source.id,
              category_id: category?.id || null,
              original_title: item.title || 'Untitled',
              original_content: item.content || item.contentSnippet || item.description || '',
              original_summary: item.contentSnippet || item.description || '',
              original_language: source.language || 'en',
              original_url: item.link || '',
              image_url: imageUrl || item.enclosure?.url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800',
              author: item.creator || item.author || null,
              published_at: item.pubDate || item.isoDate || new Date().toISOString(),
              status: 'fetched', // Ready for translation
              view_count: 0,
              like_count: 0,
              comment_count: 0,
            })

          if (!insertError) {
            articlesNew++
          } else {
            console.error('   Error inserting article:', insertError)
          }
        }

        const duration = Date.now() - startTime

        // Log successful fetch
        await supabase.from('fetch_logs').insert({
          source_id: source.id,
          status: articlesNew > 0 ? 'success' : 'partial',
          articles_found: articlesFound,
          articles_new: articlesNew,
          articles_duplicate: articlesDuplicate,
          fetch_duration_ms: duration,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        })

        // Update source last_fetched_at
        await supabase
          .from('sources')
          .update({ last_fetched_at: new Date().toISOString() })
          .eq('id', source.id)

        console.log(`   ✅ New: ${articlesNew} | Duplicate: ${articlesDuplicate}`)

        totalFetched += articlesFound
        totalNew += articlesNew
        totalDuplicate += articlesDuplicate

        fetchResults.push({
          source: source.name,
          found: articlesFound,
          new: articlesNew,
          duplicate: articlesDuplicate,
          duration: `${duration}ms`,
        })

      } catch (error: any) {
        console.error(`   ❌ Error fetching ${source.name}:`, error.message)
        
        // Log failed fetch
        await supabase.from('fetch_logs').insert({
          source_id: source.id,
          status: 'failed',
          error_message: error.message,
          articles_found: 0,
          articles_new: 0,
          articles_duplicate: 0,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        })

        fetchResults.push({
          source: source.name,
          error: error.message,
        })
      }
    }

    console.log('\n✅ Fetch completed!')
    console.log(`📊 Total: ${totalFetched} found | ${totalNew} new | ${totalDuplicate} duplicate`)

    return NextResponse.json({
      success: true,
      summary: {
        sources_processed: sources.length,
        articles_found: totalFetched,
        articles_new: totalNew,
        articles_duplicate: totalDuplicate,
      },
      results: fetchResults,
    })

  } catch (error: any) {
    console.error('❌ Fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Auto-detect RSS feed URL from website
async function detectRssFeed(websiteUrl: string): Promise<string | null> {
  const commonPatterns = [
    '/rss',
    '/rss.xml',
    '/feed',
    '/feed.xml',
    '/feeds/posts/default',
    '/index.xml',
  ]

  for (const pattern of commonPatterns) {
    const testUrl = websiteUrl.replace(/\/$/, '') + pattern
    try {
      const response = await fetch(testUrl, { method: 'HEAD' })
      if (response.ok) {
        console.log(`   ✅ Auto-detected RSS: ${testUrl}`)
        return testUrl
      }
    } catch {
      // Continue to next pattern
    }
  }

  return null
}

// Determine article category based on content/keywords
async function determineCategory(item: any, source: any): Promise<string> {
  const title = (item.title || '').toLowerCase()
  const content = (item.contentSnippet || item.description || '').toLowerCase()
  const text = title + ' ' + content

  // Simple keyword matching (can be improved later)
  if (text.match(/election|government|parliament|minister|politics|party/i)) {
    return 'politics'
  } else if (text.match(/economy|business|trade|market|stock|bank|finance/i)) {
    return 'economy'
  } else if (text.match(/sport|football|cricket|game|player|match|champion/i)) {
    return 'sports'
  } else if (text.match(/tech|technology|internet|software|app|digital|ai/i)) {
    return 'tech'
  } else if (text.match(/health|medical|disease|hospital|doctor|covid/i)) {
    return 'health'
  } else if (text.match(/entertainment|movie|music|celebrity|film|actor/i)) {
    return 'entertainment'
  }

  // Default to world or source category
  return source.category?.toLowerCase() || 'world'
}

// Extract image URL from HTML content
function extractImageUrl(content: string): string | null {
  const imgMatch = content.match(/<img[^>]+src="([^">]+)"/i)
  if (imgMatch && imgMatch[1]) {
    return imgMatch[1]
  }
  return null
}