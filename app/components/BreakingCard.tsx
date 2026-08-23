'use client'

import Link from 'next/link'
import { Clock, ArrowRight } from 'lucide-react'

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
  if (diffMins  < 60) return `${diffMins} मिनेट अघि`
  if (diffHours < 24) return `${diffHours} घण्टा अघि`
  return `${Math.floor(diffHours / 24)} दिन अघि`
}

export default function BreakingCard({
  id, title, summary, imageUrl, publishedAt, source,
}: Props) {
  return (
    <div className="bg-gray-900 border-b-4 border-red-600">
      <div className="container mx-auto px-4 py-5">

        {/* Breaking Label */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-500 font-black text-xs tracking-widest uppercase">
              ब्रेकिङ न्युज
            </span>
          </div>
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/40 text-xs">
            {getRelativeTime(publishedAt || null)}
          </span>
        </div>

        {/* Card */}
        <Link href={`/news/${id}`} className="block group">
          <div className="flex flex-col md:flex-row gap-5">

            {/* Image */}
            {imageUrl && (
              <div className="md:w-80 h-52 md:h-48 flex-shrink-0 rounded-xl overflow-hidden">
                <img
                  src={imageUrl}
                  alt={title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-90"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800'
                  }}
                />
              </div>
            )}

            {/* Content */}
            <div className="flex-1 flex flex-col justify-between py-1">
              <div>
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white leading-snug mb-3 nepali-text group-hover:text-red-400 transition-colors duration-200">
                  {title}
                </h2>
                {summary && (
                  <p className="text-white/60 text-sm md:text-base line-clamp-3 nepali-text leading-relaxed">
                    {summary}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-3">
                  <span className="bg-white/10 border border-white/20 text-white/80 px-3 py-1 rounded-full text-xs font-medium">
                    {source}
                  </span>
                  <span className="flex items-center gap-1 text-white/40 text-xs">
                    <Clock className="w-3 h-3" />
                    {getRelativeTime(publishedAt || null)}
                  </span>
                </div>
                <span className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-full text-xs font-bold transition-all group-hover:gap-2.5 nepali-text">
                  पूरा पढ्नुहोस्
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}