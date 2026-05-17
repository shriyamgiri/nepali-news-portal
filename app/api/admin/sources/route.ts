export const dynamic = 'force-dynamic'  // ← Add this as first line

import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

// GET - Fetch all sources
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('sources')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ sources: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Add new source
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const { data, error } = await supabase
      .from('sources')
      .insert({
        name: body.name,
        website_url: body.website_url,
        rss_feed_url: body.rss_feed_url || null,
        language: body.language || 'en',
        category: body.category || 'General',
        is_active: body.is_active !== false,
        fetch_interval_minutes: body.fetch_interval_minutes || 30,
        credibility_score: body.credibility_score || 5,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, source: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH - Update source
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    const { data, error } = await supabase
      .from('sources')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, source: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Remove source
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Source ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('sources')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}