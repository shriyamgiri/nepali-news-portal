'use client'

import Link from 'next/link'
import { Clock, ExternalLink } from 'lucide-react'

interface Props {
  id: string
  title: string
  summary?: string | null
  imageUrl?: string | null
  publishedAt?: string | null
  source: string
}

function getRelativeTime(timestamp: string | null): string {
  if (!timestamp) return 'हालै'
  const diffMs    = Date.now() - new Date(timestamp).getTime()
  const diffMins  = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  if (diffMins < 60)  return `${diffMins} मिनेट अघि`
  if (diffHours < 24) return `${diffHours} घण्टा अघि`
  return `${Math.floor(diffHours / 24)} दिन अघि`
}

export default function BreakingCard({ id, title, summary, imageUrl, publishedAt, source }: Props) {
  return (
    <div className="bg-gradient-to-r from-red-700 via-red-600 to-red-700 py-1">
      <div className="container mx-auto px-4 py-4">

        {/* Breaking Label */}
        <div className="flex items-center gap-2 mb-3">
          <span className="flex items-center gap-1.5 bg-white text-red-700 px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase">
            <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
            ब्रेकिङ न्युज
          </span>
          <div className="flex-1 h-px bg-white/30" />
        </div>

        {/* Card Content */}
        <Link href={`/news/${id}`} className="block group">
          <div className="flex flex-col md:flex-row gap-4 bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/20 hover:bg-white/20 transition-all duration-300">

            {/* Image */}
            {imageUrl && (
              <div className="md:w-72 h-48 md:h-auto flex-shrink-0 overflow-hidden">
                <img
                  src={imageUrl}
                  alt={title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800'
                  }}
                />
              </div>
            )}

            {/* Text Content */}
            <div className="flex-1 p-4 md:p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white leading-snug mb-3 nepali-text group-hover:text-yellow-200 transition-colors">
                  {title}
                </h2>
                {summary && (
                  <p className="text-white/80 text-sm md:text-base line-clamp-3 nepali-text leading-relaxed">
                    {summary}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/20">
                <div className="flex items-center gap-3 text-white/70 text-sm">
                  <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-medium text-white">
                    {source}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {getRelativeTime(publishedAt || null)}
                  </span>
                </div>
                <span className="flex items-center gap-1.5 bg-white text-red-700 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-yellow-100 transition group-hover:gap-2">
                  पूरा पढ्नुहोस्
                  <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}