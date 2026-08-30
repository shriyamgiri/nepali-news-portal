export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/app/lib/supabase'

const GITHUB_TOKEN      = process.env.GITHUB_TOKEN || ''
const GITHUB_REPO_OWNER = process.env.GITHUB_REPO_OWNER || ''
const GITHUB_REPO_NAME  = process.env.GITHUB_REPO_NAME || ''

// POST - Trigger reel generation
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { article_id } = body

    if (!article_id) {
      return NextResponse.json({ error: 'article_id required' }, { status: 400 })
    }

    // Create reel record
    const { data: reel, error: reelError } = await supabase
      .from('reels')
      .insert({
        article_id,
        status: 'pending',
      })
      .select()
      .single()

    if (reelError) throw reelError

    // Trigger GitHub Actions workflow
    const githubUrl = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/actions/workflows/generate-reel.yml/dispatches`

    const githubResponse = await fetch(githubUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: {
          article_id: article_id,
          reel_id: reel.id,
        },
      }),
    })

    if (!githubResponse.ok) {
      const errorText = await githubResponse.text()
      await supabase
        .from('reels')
        .update({ status: 'failed', error_message: `GitHub trigger failed: ${errorText}` })
        .eq('id', reel.id)

      throw new Error(`GitHub Actions trigger failed: ${errorText}`)
    }

    return NextResponse.json({
      success: true,
      reel_id: reel.id,
      message: 'Reel generation started! Check status in a few minutes.',
    })

  } catch (error: any) {
    console.error('Reel generation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET - Check reel status
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const reelId = searchParams.get('id')
    const articleId = searchParams.get('article_id')

    let query = supabase.from('reels').select('*')

    if (reelId) {
      query = query.eq('id', reelId)
    } else if (articleId) {
      query = query.eq('article_id', articleId).order('created_at', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false }).limit(20)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ reels: data })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}