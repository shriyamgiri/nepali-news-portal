import { supabase } from '@/app/lib/supabase'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const article = await getArticleById(params.id)

  if (!article) {
    return { title: 'Article Not Found | GN Nepal' }
  }

  const title       = article.nepali_title || article.original_title
  const description = article.nepali_summary || article.original_summary || ''
  const image       = article.image_url || 'https://nepali-news-portal-wheat.vercel.app/og-image.jpg'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images:   [{ url: image, width: 1200, height: 630 }],
      type:     'article',
      locale:   'ne_NP',
      siteName: 'GN Nepal',
    },
    twitter: {
      card:        'summary_large_image',
      title,
      description,
      images:      [image],
    },
  }
}

export default async function NewsArticle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Fetch article from database
  const { data: article, error } = await supabase
    .from('articles')
    .select(`
      *,
      categories (
        name_en,
        name_ne,
        slug,
        icon
      ),
      sources (
        name,
        website_url
      )
    `)
    .eq('id', id)
    .single()

  if (error || !article) {
    notFound()
  }

  // Increment view count
  await supabase
    .from('articles')
    .update({ view_count: (article.view_count || 0) + 1 })
    .eq('id', id)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <article className="bg-white rounded-xl shadow-sm p-6 md:p-8 border border-gray-100">
            {/* Category Badge */}
            <Link 
              href={`/${article.categories?.slug || 'news'}`}
              className="inline-block px-3 py-1 bg-nepal-red text-white text-sm font-medium rounded-full mb-4 nepali-text hover:bg-nepal-red/90 transition"
            >
              {article.categories?.name_ne || 'समाचार'}
            </Link>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 nepali-text">
              {article.nepali_title || article.original_title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6 pb-6 border-b border-gray-200">
              <span>
                📅 {new Date(article.published_at || article.created_at).toLocaleDateString('ne-NP')}
              </span>
              <span>
                👁 {article.view_count || 0} पटक पढिएको
              </span>
            </div>

            {/* Source Attribution */}
            <div className="bg-blue-50 border-l-4 border-nepal-blue p-4 mb-6 rounded nepali-text">
              <p className="text-sm text-gray-700">
                <strong>स्रोत:</strong> {article.sources?.name || 'Unknown'} |{' '}
                {article.sources?.website_url && (
                  <a 
                    href={article.original_url || article.sources.website_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-nepal-blue hover:underline inline-flex items-center gap-1"
                  >
                    मूल समाचार पढ्नुहोस् ↗
                  </a>
                )}
              </p>
            </div>

            {/* Featured Image */}
            {article.image_url && (
              <div className="mb-6 rounded-lg overflow-hidden">
                <img
                  src={article.image_url}
                  alt={article.nepali_title || article.original_title}
                  className="w-full h-auto"
                />
              </div>
            )}

            {/* Article Content */}
            <div className="prose prose-lg max-w-none nepali-text">
              {article.nepali_content ? (
                article.nepali_content.split('\n\n').map((paragraph: string, index: number) => (
                  <p key={index} className="mb-4 text-gray-700 leading-relaxed text-lg">
                    {paragraph}
                  </p>
                ))
              ) : article.nepali_summary ? (
                <p className="mb-4 text-gray-700 leading-relaxed text-lg">
                  {article.nepali_summary}
                </p>
              ) : article.original_content ? (
                article.original_content.split('\n\n').map((paragraph: string, index: number) => (
                  <p key={index} className="mb-4 text-gray-700 leading-relaxed text-lg">
                    {paragraph}
                  </p>
                ))
              ) : (
                <p className="text-gray-500 italic">No content available</p>
              )}
            </div>

            {/* Back Button */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-nepal-blue hover:underline nepali-text"
              >
                ← गृहपृष्ठमा फर्कनुहोस्
              </Link>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  )
}