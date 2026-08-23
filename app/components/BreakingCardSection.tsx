export const dynamic  = 'force-dynamic'
export const revalidate = 0

import { supabase } from '../lib/supabase'
import BreakingCard from './BreakingCard'

export default async function BreakingCardSection() {
  const { data: breakingArticles } = await supabase
    .from('articles')
    .select('id, nepali_title, nepali_summary, image_url, published_at, sources(name)')
    .eq('status', 'published')
    .eq('is_breaking', true)
    .not('nepali_title', 'is', null)
    .gt('breaking_expires_at', new Date().toISOString())
    .order('priority_score', { ascending: false })
    .limit(1)

  if (!breakingArticles?.length) return null

  const article = breakingArticles[0]

  return (
    <BreakingCard
      id={article.id}
      title={article.nepali_title}
      summary={article.nepali_summary}
      imageUrl={article.image_url}
      publishedAt={article.published_at}
      source={(article.sources as any)?.name || 'GN Nepal'}
    />
  )
}