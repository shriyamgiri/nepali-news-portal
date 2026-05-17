import Header from '../components/Header'
import Footer from '../components/Footer'
import NewsCard from '../components/NewsCard'
import { supabase } from '../lib/supabase'

export default async function TrendingPage() {
  const { data: articles } = await supabase
    .from('articles')
    .select(`
      *,
      categories (name_en, name_ne, slug, icon),
      sources (name, website_url)
    `)
    .eq('status', 'published')
    .order('view_count', { ascending: false })
    .limit(20)

  const transformArticle = (article: any) => ({
    id: article.id,
    title: article.nepali_title || article.original_title,
    summary: article.nepali_summary || article.original_summary || '',
    category: article.categories?.name_ne || 'समाचार',
    source: article.sources?.name || 'Unknown',
    imageUrl: article.image_url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800',
    publishedAt: getRelativeTime(article.published_at),
    views: article.view_count || 0,
    comments: article.comment_count || 0,
    likes: article.like_count || 0,
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 nepali-text mb-2">🔥 ट्रेन्डिङ समाचार</h1>
          <p className="text-gray-600">सबैभन्दा धेरै पढिएका समाचारहरू</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles?.map((article: any) => (
            <NewsCard key={article.id} {...transformArticle(article)} />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}

function getRelativeTime(timestamp: string | null): string {
  if (!timestamp) return 'हालै'
  const now = new Date()
  const then = new Date(timestamp)
  const diffMs = now.getTime() - then.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHours < 1) return `${Math.floor(diffMs / (1000 * 60))} मिनेट अघि`
  if (diffHours < 24) return `${diffHours} घण्टा अघि`
  return `${Math.floor(diffHours / 24)} दिन अघि`
}