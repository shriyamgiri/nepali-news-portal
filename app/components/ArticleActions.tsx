'use client'

import { ExternalLink, Share2 } from 'lucide-react'

interface ArticleActionsProps {
  originalUrl: string | null
  title: string | null
  summary: string
}

export default function ArticleActions({ originalUrl, title, summary }: ArticleActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-gray-100">
      {originalUrl && (
        <a
          href={originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-nepal-blue text-white rounded-lg hover:bg-nepal-blue/90 transition text-sm"
        >
          <ExternalLink className="w-4 h-4" />
          <span>मूल समाचार पढ्नुहोस्</span>
        </a>
      )}
      <button
        onClick={() => {
          if (navigator.share) {
            navigator.share({ title: title ?? '', text: summary, url: window.location.href })
          } else {
            navigator.clipboard.writeText(window.location.href)
          }
        }}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
      >
        <Share2 className="w-4 h-4" />
        <span>शेयर गर्नुहोस्</span>
      </button>
    </div>
  )
}
