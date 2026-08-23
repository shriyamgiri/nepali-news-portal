import { supabase } from '../lib/supabase'
import BreakingNewsTicker from './BreakingNewsTicker'

export default async function BreakingNews() {
  // Fetch real breaking news from DB
  const { data: breakingArticles } = await supabase
    .from('articles')
    .select('id, nepali_title, published_at')
    .eq('status', 'published')
    .eq('is_breaking', true)
    .not('nepali_title', 'is', null)
    .gt('breaking_expires_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .limit(5)

  // Fallback to latest articles if no breaking news
  const { data: latestArticles } = !breakingArticles?.length 
    ? await supabase
        .from('articles')
        .select('id, nepali_title, published_at')
        .eq('status', 'published')
        .not('nepali_title', 'is', null)
        .order('published_at', { ascending: false })
        .limit(5)
    : { data: null }

  const articles = breakingArticles?.length 
    ? breakingArticles 
    : latestArticles || []

  if (!articles.length) return null

  const newsItems = articles.map((a: any) => ({
    id: a.id,
    text: a.nepali_title,
    link: `/news/${a.id}`,
  }))

  return <BreakingNewsTicker items={newsItems} isBreaking={!!breakingArticles?.length} />
}