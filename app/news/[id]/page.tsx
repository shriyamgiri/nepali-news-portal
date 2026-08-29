export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, Eye } from 'lucide-react'
import { getArticleById } from '@/app/lib/database'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import ArticleImage from '@/app/components/ArticleImage'
import ArticleActions from '@/app/components/ArticleActions'

const SITE_URL = 'https://nepali-news-portal-wheat.vercel.app'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const article = await getArticleById(params.id)

  if (!article) {
    return { title: 'Article Not Found | GN Nepal' }
  }

  const title = article.nepali_title || article.original_title
  const description = article.nepali_summary || article.original_summary || ''
  const image = article.image_url || `${SITE_URL}/og-image.jpg`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image, width: 1200, height: 630 }],
      type: 'article',
      locale: 'ne_NP',
      siteName: 'GN Nepal',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

function getRelativeTime(timestamp: string | null): string {
  if (!timestamp) return 'हालै'
  const utcStr = timestamp.endsWith('Z') ? timestamp : timestamp + 'Z'
  const then = new Date(utcStr)
  const now = new Date()
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  if (diffMins < 1) return 'भर्खरै'
  if (diffMins < 60) return `${diffMins} मिनेट अघि`
  if (diffHours < 24) return `${diffHours} घण्टा अघि`
  return `${diffDays} दिन अघि`
}

function formatNPT(dateStr: string | null): string {
  if (!dateStr) return '—'
  const utcStr = dateStr.endsWith('Z') ? dateStr : dateStr + 'Z'
  const date = new Date(utcStr)
  const nepalOffset = 5 * 60 + 45
  const nepalTime = new Date(date.getTime() + nepalOffset * 60 * 1000)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const day = nepalTime.getUTCDate().toString().padStart(2, '0')
  const month = months[nepalTime.getUTCMonth()]
  const year = nepalTime.getUTCFullYear()
  const hours = nepalTime.getUTCHours()
  const mins = nepalTime.getUTCMinutes().toString().padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const h12 = (hours % 12 || 12).toString().padStart(2, '0')
  return `${day}-${month}-${year}, ${h12}:${mins} ${ampm} NPT`
}

export default async function ArticlePage({ params }: { params: { id: string } }) {
  const article = await getArticleById(params.id)

  if (!article) {
    notFound()
  }

  const title = article.nepali_title || article.original_title
  const summary = article.nepali_summary || article.original_summary || ''
  const content = article.nepali_content || article.original_content || ''
  const source = (article as any).sources?.name || 'Unknown'
  const category = (article as any).categories?.name_ne || 'समाचार'

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">

        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-nepal-blue transition mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm nepali-text">गृहपृष्ठमा फर्कनुहोस्</span>
        </Link>

        <article className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

          {/* Hero Image */}
          {article.image_url && (
            <ArticleImage
              src={article.image_url}
              alt={article.nepali_title}
              category={category}
              isBreaking={article.is_breaking || false}
            />
          )}

          <div className="p-6 md:p-8">

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-snug mb-4 nepali-text">
              {title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 pb-4 mb-6 border-b border-gray-100">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span className="nepali-text">
                  {getRelativeTime(article.translated_at || article.published_at)}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                {article.view_count} views
              </span>
              <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-medium">
                स्रोत: {source}
              </span>
              {(article as any).nepal_related && (
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                  🇳🇵 Nepal
                </span>
              )}
              <span className="text-xs text-gray-400">
                {formatNPT(article.translated_at || article.published_at)}
              </span>
            </div>

            {/* Summary */}
            {summary && (
              <div className="bg-gray-50 border-l-4 border-nepal-blue rounded-r-lg p-4 mb-6">
                <p className="text-gray-700 leading-relaxed nepali-text font-medium">
                  {summary}
                </p>
              </div>
            )}

            {/* Content */}
            {content && (
              <div className="prose prose-lg max-w-none nepali-text text-gray-800 leading-relaxed mb-8">
                {content.split('\n\n').map((paragraph: string, index: number) => (
                  <p key={index} className="mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>
            )}

            {/* Actions */}
            <ArticleActions
              originalUrl={article.original_url}
              title={article.nepali_title}
              summary={summary}
            />

          </div>
        </article>

        {/* Attribution */}
        <div className="mt-6 text-center text-xs text-gray-400 nepali-text">
          यो समाचार {source} बाट अनुवाद गरिएको हो। GN Nepal मौलिक समाचार संस्था होइन।
        </div>

      </main>

      <Footer />
    </div>
  )
}