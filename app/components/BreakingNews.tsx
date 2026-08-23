export const dynamic = 'force-dynamic'
export const revalidate = 0

import { supabase } from '../lib/supabase'
import BreakingNewsTicker from './BreakingNewsTicker'
import BreakingCard from './BreakingCard'
import Link from 'next/link'

export default async function BreakingNews() {
  // Fetch breaking news
  const { data: breakingArticles } = await supabase
    .from('articles')
    .select('id, nepali_title, nepali_summary, image_url, published_at, sources(name)')
    .eq('status', 'published')
    .eq('is_breaking', true)
    .not('nepali_title', 'is', null)
    .gt('breaking_expires_at', new Date().toISOString())
    .order('priority_score', { ascending: false })
    .limit(5)

  // Fallback to latest articles for ticker
  const { data: latestArticles } = await supabase
    .from('articles')
    .select('id, nepali_title, published_at')
    .eq('status', 'published')
    .not('nepali_title', 'is', null)
    .order('published_at', { ascending: false })
    .limit(5)

  const hasBreaking = !!(breakingArticles?.length)

  // Ticker items
  const tickerItems = (hasBreaking ? breakingArticles : latestArticles)?.map((a: any) => ({
    id: a.id,
    text: a.nepali_title,
    link: `/news/${a.id}`,
  })) || []

  // Top breaking article for large card
  const topBreaking = hasBreaking ? breakingArticles![0] : null

  return (
    <>
      {/* Always show ticker */}
      <BreakingNewsTicker items={tickerItems} isBreaking={hasBreaking} />

      {/* Show large card only when real breaking news exists */}
      {topBreaking && (
        <BreakingCard
          id={topBreaking.id}
          title={topBreaking.nepali_title}
          summary={topBreaking.nepali_summary}
          imageUrl={topBreaking.image_url}
          publishedAt={topBreaking.published_at}
          source={(topBreaking.sources as any)?.name || 'GN Nepal'}
        />
      )}
    </>
  )
}