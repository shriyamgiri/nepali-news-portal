export const dynamic = 'force-dynamic'
export const revalidate = 0

import { notFound } from 'next/navigation'
import Header from '../components/Header'
import Footer from '../components/Footer'
import NewsCard from '../components/NewsCard'
import TrendingNews from '../components/TrendingNews'
import { supabase } from '../lib/supabase'


const VALID_CATEGORIES = ['politics', 'economy', 'sports', 'tech', 'entertainment', 'world', 'health']


const CATEGORY_INFO: Record<string, { nameNe: string; icon: string }> = {
  politics: { nameNe: 'राजनीति', icon: '⚖️' },
  economy: { nameNe: 'अर्थतन्त्र', icon: '💼' },
  sports: { nameNe: 'खेलकुद', icon: '⚽' },
  tech: { nameNe: 'प्रविधि', icon: '💻' },
  entertainment: { nameNe: 'मनोरञ्जन', icon: '🎬' },
  world: { nameNe: 'विश्व', icon: '🌍' },
  health: { nameNe: 'स्वास्थ्य', icon: '🏥' },
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

export default async function CategoryPage(props: { params: Promise<{ category: string }> }) {
  const params = await props.params
  const category = params.category

  if (!VALID_CATEGORIES.includes(category)) {
    notFound()
  }

  const categoryInfo = CATEGORY_INFO[category]
  const { data: articles } = await supabase.from('articles').select('*, categories!inner(name_en, name_ne, slug, icon), sources(name, website_url)').eq('categories.slug', category).eq('status', 'published').order('published_at', { ascending: false }).limit(20)

  const transformedArticles = (articles || []).map((article: any) => ({
    id: article.id,
    title: article.nepali_title || article.original_title,
    summary: article.nepali_summary || article.original_summary || '',
    category: article.categories?.name_ne || categoryInfo.nameNe,
    source: article.sources?.name || 'Unknown',
    imageUrl: article.image_url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800',
    publishedAt: getRelativeTime(article.published_at),
    views: article.view_count || 0,
    comments: article.comment_count || 0,
    likes: article.like_count || 0,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-5xl">{categoryInfo.icon}</span>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 nepali-text">{categoryInfo.nameNe}</h1>
              <p className="text-gray-600 text-sm mt-1">{transformedArticles.length} समाचार उपलब्ध छ</p>
            </div>
          </div>
          <div className="h-1 w-20 bg-gradient-to-r from-nepal-blue to-nepal-red rounded"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {transformedArticles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {transformedArticles.map((article) => <NewsCard key={article.id} {...article} />)}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
                <span className="text-6xl mb-4 block">📭</span>
                <h3 className="text-xl font-bold text-gray-800 mb-2 nepali-text">कुनै समाचार भेटिएन</h3>
                <p className="text-gray-600 nepali-text mb-6">यो श्रेणीमा अहिले कुनै समाचार उपलब्ध छैन।</p>
                <a href="/" className="inline-block px-6 py-3 bg-nepal-blue text-white rounded-lg hover:bg-nepal-blue/90 transition nepali-text">गृहपृष्ठमा फर्कनुहोस्</a>
              </div>
            )}
          </div>
          <aside className="space-y-6">
            <TrendingNews />
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 nepali-text">अन्य श्रेणीहरू</h3>
              <div className="space-y-2">
                {Object.entries(CATEGORY_INFO).filter(([slug]) => slug !== category).map(([slug, info]) => (
                  <a key={slug} href={`/${slug}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition">
                    <span className="text-2xl">{info.icon}</span>
                    <span className="font-medium text-gray-700 nepali-text">{info.nameNe}</span>
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export async function generateStaticParams() {
  return VALID_CATEGORIES.map((category) => ({ category }))
}