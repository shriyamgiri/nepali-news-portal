'use client'

import { useState, useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

const BreakingNews = () => {
  const breakingNews = [
    { id: 1, text: 'काठमाडौंमा नयाँ मेट्रो रेल सेवा सुरु', link: '/news/1' },
    { id: 2, text: 'नेपाल र चीनबीच ऐतिहासिक व्यापार सम्झौता', link: '/news/2' },
    { id: 3, text: 'सगरमाथा आधार शिविरमा नयाँ सुविधा', link: '/news/3' },
  ]

  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % breakingNews.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [breakingNews.length])

  return (
    <div className="bg-gradient-to-r from-nepal-red to-red-600 text-white py-3 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 flex-shrink-0">
            <AlertCircle className="w-5 h-5 animate-pulse" />
            <span className="font-bold text-sm nepali-text">ताजा समाचार</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <Link
              href={breakingNews[currentIndex].link}
              className="block hover:underline"
            >
              <p className="text-sm nepali-text animate-slideLeft whitespace-nowrap">
                {breakingNews[currentIndex].text}
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BreakingNews
