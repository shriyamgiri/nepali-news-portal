export const dynamic   = 'force-dynamic'
export const revalidate = 0

import { supabase } from '../lib/supabase'
import BreakingNewsTicker from './BreakingNewsTicker'

export default async function BreakingNews() {
  // Ticker ALWAYS shows latest 20 articles
  // is_breaking only controls the color/label
  const { data: breakingArticles } = await supabase
    .from('articles')
    .select('id, nepali_title, published_at')
    .eq('status', 'published')
    .eq('is_breaking', true)
    .not('nepali_title', 'is', null)
    .gt('breaking_expires_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .limit(5)

  // Always fetch latest 20 for ticker
  const { data: latestArticles } = await supabase
    .from('articles')
    .select('id, nepali_title, published_at')
    .eq('status', 'published')
    .not('nepali_title', 'is', null)
    .order('published_at', { ascending: false })
    .limit(20)

  const hasBreaking = !!(breakingArticles?.length)

  // Ticker always uses latest 20 articles
  // isBreaking only changes the badge color/label
  const tickerItems = (latestArticles || []).map((a: any) => ({
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