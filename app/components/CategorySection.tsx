'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface Article {
  id: number
  title: string
  summary: string
  imageUrl: string
  publishedAt: string
}

interface CategorySectionProps {
  title: string
  icon: string
  slug: string
  articles: Article[]
}

const CategorySection = ({ title, icon, slug, articles }: CategorySectionProps) => {
  return (
    <section className="mb-12">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6 pb-3 border-b-2 border-nepal-blue">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{icon}</span>
          <h2 className="text-2xl font-bold text-gray-800 nepali-text">{title}</h2>
        </div>
        <Link
          href={slug}
          className="flex items-center gap-1 text-nepal-blue hover:gap-2 transition-all font-medium nepali-text"
        >
          सबै हेर्नुहोस्
          <ChevronRight className="w-5 h-5" />
        </Link>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {articles.map((article, index) => (
          <Link
            key={article.id}
            href={`/news/${article.id}`}
            className={`group ${index === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
          >
            <article className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 h-full">
              {/* Image */}
              <div className={`relative overflow-hidden bg-gray-200 ${index === 0 ? 'aspect-video' : 'aspect-[4/3]'}`}>
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>

              {/* Content */}
              <div className="p-4">
                <h3
                  className={`font-bold text-gray-800 group-hover:text-nepal-blue transition nepali-text mb-2 ${
                    index === 0 ? 'text-xl line-clamp-3' : 'text-base line-clamp-2'
                  }`}
                >
                  {article.title}
                </h3>
                {index === 0 && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3 nepali-text">
                    {article.summary}
                  </p>
                )}
                <span className="text-xs text-gray-500">{article.publishedAt}</span>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default CategorySection
