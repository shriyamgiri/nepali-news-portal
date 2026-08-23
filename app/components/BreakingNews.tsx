export const dynamic  = 'force-dynamic'
export const revalidate = 0

import { supabase } from '../lib/supabase'
import BreakingNewsTicker from './BreakingNewsTicker'

export default async function BreakingNews() {
  // Try breaking news first
  const { data: breakingArticles } = await supabase
    .from('articles')
    .select('id, nepali_title, published_at')
    .eq('status', 'published')
    .eq('is_breaking', true)
    .not('nepali_title', 'is', null)
    .gt('breaking_expires_at', new Date().toISOString())
    .order('priority_score', { ascending: false })
    .limit(5)

  // Fallback to latest
  const { data: latestArticles } = await supabase
    .from('articles')
    .select('id, nepali_title, published_at')
    .eq('status', 'published')
    .not('nepali_title', 'is', null)
    .order('published_at', { ascending: false })
    .limit(5)

  const hasBreaking = !!(breakingArticles?.length)
  const articles    = hasBreaking ? breakingArticles! : (latestArticles || [])

  const tickerItems = articles.map((a: any) => ({
    id:   a.id,
    text: a.nepali_title,
    link: `/news/${a.id}`,
  }))

  return (
    <BreakingNewsTicker
      items={tickerItems}
      isBreaking={hasBreaking}
    />
  )
}