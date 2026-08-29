'use client'

interface ArticleImageProps {
  src: string
  alt: string | null
  category: string
  isBreaking: boolean
}

export default function ArticleImage({ src, alt, category, isBreaking }: ArticleImageProps) {
  return (
    <div className="relative h-64 md:h-96 overflow-hidden bg-gray-200">
      <img
        src={src}
        alt={alt ?? ''}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800'
        }}
      />
      <div className="absolute top-4 left-4">
        <span className="bg-nepal-red text-white text-sm px-3 py-1 rounded-full font-medium nepali-text">
          {category}
        </span>
      </div>
      {isBreaking && (
        <div className="absolute top-4 right-4">
          <span className="bg-red-600 text-white text-xs px-3 py-1 rounded-full font-bold animate-pulse">
            🔴 ब्रेकिङ
          </span>
        </div>
      )}
    </div>
  )
}
