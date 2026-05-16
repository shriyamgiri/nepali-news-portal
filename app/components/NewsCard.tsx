'use client'

import Link from 'next/link'
import { Clock, Eye, MessageCircle, ThumbsUp, Share2 } from 'lucide-react'
import { useState } from 'react'

interface NewsCardProps {
  id: number
  title: string
  summary: string
  category: string
  source: string
  imageUrl: string
  publishedAt: string
  views: number
  comments: number
  likes: number
  featured?: boolean
}

const NewsCard = ({
  id,
  title,
  summary,
  category,
  source,
  imageUrl,
  publishedAt,
  views,
  comments,
  likes,
  featured = false,
}: NewsCardProps) => {
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(likes)

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault()
    if (isLiked) {
      setLikeCount(likeCount - 1)
    } else {
      setLikeCount(likeCount + 1)
    }
    setIsLiked(!isLiked)
  }

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault()
    if (navigator.share) {
      navigator.share({
        title: title,
        text: summary,
        url: `/news/${id}`,
      })
    }
  }

  return (
    <article
      className={`group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 ${
        featured ? 'md:col-span-2 md:row-span-2' : ''
      }`}
    >
      <Link href={`/news/${id}`} className="block">
        {/* Image */}
        <div className="relative overflow-hidden aspect-video bg-gray-200">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          {/* Category Badge */}
          <span className="absolute top-3 left-3 px-3 py-1 bg-nepal-red text-white text-sm font-medium rounded-full shadow-lg nepali-text">
            {category}
          </span>
          {/* Source Badge */}
          <span className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 text-white text-xs rounded backdrop-blur-sm">
            स्रोत: {source}
          </span>
        </div>

        {/* Content */}
        <div className="p-4 md:p-5">
          {/* Title */}
          <h3
            className={`font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-nepal-blue transition nepali-text ${
              featured ? 'text-xl md:text-2xl' : 'text-lg'
            }`}
          >
            {title}
          </h3>

          {/* Summary */}
          <p
            className={`text-gray-600 mb-4 nepali-text ${
              featured ? 'line-clamp-3 text-base' : 'line-clamp-2 text-sm'
            }`}
          >
            {summary}
          </p>

          {/* Meta Info */}
          <div className="flex items-center justify-between text-sm text-gray-500 border-t border-gray-100 pt-3">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {publishedAt}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {views}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition ${
                isLiked
                  ? 'bg-red-50 text-red-600'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">{likeCount}</span>
            </button>
            <Link
              href={`/news/${id}#comments`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-gray-100 text-gray-600 transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{comments}</span>
            </Link>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-gray-100 text-gray-600 transition ml-auto"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-sm font-medium">शेयर</span>
            </button>
          </div>
        </div>
      </Link>
    </article>
  )
}

export default NewsCard
