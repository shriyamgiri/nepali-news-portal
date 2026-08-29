import { MetadataRoute } from 'next'
import { supabase } from './lib/supabase'

const SITE_URL = 'https://nepali-news-portal-wheat.vercel.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL,                   lastModified: new Date(), changeFrequency: 'hourly',  priority: 1.0 },
    { url: `${SITE_URL}/politics`,     lastModified: new Date(), changeFrequency: 'hourly',  priority: 0.8 },
    { url: `${SITE_URL}/economy`,      lastModified: new Date(), changeFrequency: 'hourly',  priority: 0.8 },
    { url: `${SITE_URL}/sports`,       lastModified: new Date(), changeFrequency: 'hourly',  priority: 0.8 },
    { url: `${SITE_URL}/tech`,         lastModified: new Date(), changeFrequency: 'daily',   priority: 0.7 },
    { url: `${SITE_URL}/entertainment`,lastModified: new Date(), changeFrequency: 'daily',   priority: 0.7 },
    { url: `${SITE_URL}/world`,        lastModified: new Date(), changeFrequency: 'hourly',  priority: 0.8 },
    { url: `${SITE_URL}/health`,       lastModified: new Date(), changeFrequency: 'daily',   priority: 0.7 },
  ]

  // Dynamic article pages
  const { data: articles } = await supabase
    .from('articles')
    .select('id, translated_at, published_at')
    .eq('status', 'published')
    .not('nepali_title', 'is', null)
    .order('translated_at', { ascending: false })
    .limit(1000)

  const articlePages: MetadataRoute.Sitemap = (articles || []).map(article => ({
    url:             `${SITE_URL}/news/${article.id}`,
    lastModified:    new Date(article.translated_at || article.published_at || new Date()),
    changeFrequency: 'never' as const,
    priority:        0.6,
  }))

  return [...staticPages, ...articlePages]
}