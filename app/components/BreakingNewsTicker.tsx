'use client'

import { useState, useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface NewsItem {
  id: string
  text: string
  link: string
}

interface Props {
  items: NewsItem[]
  isBreaking: boolean
}

export default function BreakingNewsTicker({ items, isBreaking }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (items.length <= 1) return
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % items.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [items.length])

  if (!items.length) return null

  return (
    <div className={`text-white py-3 shadow-lg ${
      isBreaking 
        ? 'bg-gradient-to-r from-red-700 to-red-500' 
        : 'bg-gradient-to-r from-nepal-red to-red-600'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 flex-shrink-0">
            <AlertCircle className={`w-5 h-5 ${isBreaking ? 'animate-pulse' : ''}`} />
            <span className="font-bold text-sm nepali-text whitespace-nowrap">
              {isBreaking ? '🔴 ब्रेकिङ' : 'ताजा समाचार'}
            </span>
            <span className="hidden md:block text-xs bg-white/20 px-2 py-0.5 rounded">
              LIVE
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            <Link href={items[currentIndex]?.link || '/'} className="block hover:underline">
              <p className="text-sm nepali-text truncate">
                {items[currentIndex]?.text}
              </p>
            </Link>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-1.5 h-1.5 rounded-full transition ${
                  i === currentIndex ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}