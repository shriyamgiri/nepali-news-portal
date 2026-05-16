'use client'

import Link from 'next/link'
import { TrendingUp, Clock } from 'lucide-react'

interface TrendingArticle {
  id: number
  title: string
  views: number
  publishedAt: string
}

const TrendingNews = () => {
  const trendingArticles: TrendingArticle[] = [
    {
      id: 1,
      title: 'नेपाल र भारतबीच नयाँ व्यापार सम्झौता',
      views: 15420,
      publishedAt: '२ घण्टा अघि',
    },
    {
      id: 2,
      title: 'काठमाडौंमा आजदेखि विद्युत् नियमित',
      views: 12350,
      publishedAt: '४ घण्टा अघि',
    },
    {
      id: 3,
      title: 'नेपाली राष्ट्रिय फुटबल टिम फाइनलमा',
      views: 11200,
      publishedAt: '५ घण्टा अघि',
    },
    {
      id: 4,
      title: 'अमेरिकी राष्ट्रपतिको नेपाल भ्रमण',
      views: 9840,
      publishedAt: '६ घण्टा अघि',
    },
    {
      id: 5,
      title: 'सगरमाथामा नयाँ कीर्तिमान',
      views: 8750,
      publishedAt: '८ घण्टा अघि',
    },
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
        <TrendingUp className="w-5 h-5 text-nepal-red" />
        <h2 className="text-lg font-bold text-gray-800 nepali-text">
          ट्रेन्डिङ समाचार
        </h2>
      </div>

      <div className="space-y-4">
        {trendingArticles.map((article, index) => (
          <Link
            key={article.id}
            href={`/news/${article.id}`}
            className="block group"
          >
            <div className="flex gap-3">
              {/* Rank Badge */}
              <div className="flex-shrink-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0
                      ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white'
                      : index === 1
                      ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white'
                      : index === 2
                      ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {index + 1}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-800 group-hover:text-nepal-blue transition line-clamp-2 mb-1 nepali-text">
                  {article.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {article.publishedAt}
                  </span>
                  <span>👁 {article.views}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <Link
        href="/trending"
        className="block mt-4 pt-4 border-t border-gray-200 text-center text-sm font-medium text-nepal-blue hover:text-nepal-blue/80 transition nepali-text"
      >
        सबै ट्रेन्डिङ समाचार हेर्नुहोस् →
      </Link>
    </div>
  )
}

export default TrendingNews
