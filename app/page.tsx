import Header from './components/Header'
import Footer from './components/Footer'
import BreakingNews from './components/BreakingNews'
import NewsCard from './components/NewsCard'
import TrendingNews from './components/TrendingNews'
import CategorySection from './components/CategorySection'
import { getArticles, getArticlesByCategory } from './lib/database'

export default async function Home() {
  // Fetch real data from database
  const mainArticles = await getArticles(6)
  const politicsArticles = await getArticlesByCategory('politics', 4)
  const economyArticles = await getArticlesByCategory('economy', 4)
  const sportsArticles = await getArticlesByCategory('sports', 4)
  const techArticles = await getArticlesByCategory('tech', 4)

  // Transform database articles to NewsCard format
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

  const transformCategoryArticle = (article: any) => ({
    id: article.id,
    title: article.nepali_title || article.original_title,
    summary: article.nepali_summary || article.original_summary || '',
    imageUrl: article.image_url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800',
    publishedAt: getRelativeTime(article.published_at),
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <BreakingNews />

      <main className="container mx-auto px-4 py-8">
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 nepali-text">
            मुख्य समाचार
          </h2>
          
          {mainArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mainArticles.map((article: any) => (
                <NewsCard key={article.id} {...transformArticle(article)} />
              ))}
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
              <p className="text-gray-700 nepali-text mb-2">
                ⏳ समाचार लोड हुँदैछ...
              </p>
              <p className="text-sm text-gray-600">
                Database connected! Waiting for news articles...
              </p>
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-12">
            {politicsArticles.length > 0 && (
              <CategorySection
                title="राजनीति"
                icon="⚖️"
                slug="/politics"
                articles={politicsArticles.map(transformCategoryArticle)}
              />
            )}

            {economyArticles.length > 0 && (
              <CategorySection
                title="अर्थतन्त्र"
                icon="💼"
                slug="/economy"
                articles={economyArticles.map(transformCategoryArticle)}
              />
            )}

            {sportsArticles.length > 0 && (
              <CategorySection
                title="खेलकुद"
                icon="⚽"
                slug="/sports"
                articles={sportsArticles.map(transformCategoryArticle)}
              />
            )}

            {techArticles.length > 0 && (
              <CategorySection
                title="प्रविधि"
                icon="💻"
                slug="/tech"
                articles={techArticles.map(transformCategoryArticle)}
              />
            )}
          </div>

          <aside className="space-y-6">
            <TrendingNews />

            <div className="bg-gray-200 rounded-xl p-8 text-center border-2 border-dashed border-gray-300">
              <p className="text-gray-500 font-medium nepali-text">विज्ञापन स्थान</p>
              <p className="text-sm text-gray-400 mt-2">300 x 600</p>
            </div>
          </aside>
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
  
  if (diffHours < 1) {
    const diffMins = Math.floor(diffMs / (1000 * 60))
    return `${diffMins} मिनेट अघि`
  } else if (diffHours < 24) {
    return `${diffHours} घण्टा अघि`
  } else {
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} दिन अघि`
  }
}