import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await supabase
    .from('articles')
    .select('id, nepali_title, status, published_at, translated_at')
    .eq('status', 'published')
    .not('nepali_title', 'is', null)
    .order('translated_at', { ascending: false })
    .limit(5)

  return NextResponse.json({ 
    articles: data || [], 
    error: error?.message || null,
    count: data?.length || 0
  })
}