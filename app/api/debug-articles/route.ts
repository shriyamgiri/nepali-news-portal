import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

export async function GET() {
  // Test 1: Raw count
  const { count } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')

  // Test 2: Same query as homepage
  const { data: articles, error } = await supabase
    .from('articles')
    .select(`
      id,
      nepali_title,
      status,
      published_at,
      translated_at,
      category_id,
      categories (name_en, name_ne, slug),
      sources (name)
    `)
    .eq('status', 'published')
    .not('nepali_title', 'is', null)
    .order('translated_at', { ascending: false })
    .limit(5)

  return NextResponse.json({
    total_published: count,
    error: error?.message || null,
    sample_articles: articles || [],
  })
}