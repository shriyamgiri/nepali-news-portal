'use client'

import Link from 'next/link'
import { Search, Menu, X, Facebook, Youtube, Twitter } from 'lucide-react'
import { useState, useEffect } from 'react'

const categories = [
  { name: 'गृहपृष्ठ', slug: '/', icon: '🏠' },
  { name: 'राजनीति', slug: '/politics', icon: '⚖️' },
  { name: 'अर्थतन्त्र', slug: '/economy', icon: '💼' },
  { name: 'खेलकुद', slug: '/sports', icon: '⚽' },
  { name: 'प्रविधि', slug: '/tech', icon: '💻' },
  { name: 'मनोरञ्जन', slug: '/entertainment', icon: '🎬' },
  { name: 'विश्व', slug: '/world', icon: '🌍' },
  { name: 'स्वास्थ्य', slug: '/health', icon: '🏥' },
]

function useNepaliDateTime() {
  const [dateTime, setDateTime] = useState({
    nepaliDate: '',
    englishDate: '',
    time: '',
    day: '',
  })

  useEffect(() => {
    const update = () => {
      const now = new Date(
        new Date().toLocaleString('en-US', { timeZone: 'Asia/Kathmandu' })
      )

      const nepaliDays = [
        'आइतबार', 'सोमबार', 'मंगलबार',
        'बुधबार', 'बिहीबार', 'शुक्रबार', 'शनिबार',
      ]
      const nepaliMonths = [
        'बैशाख', 'जेठ', 'असार', 'साउन', 'भदौ', 'असोज',
        'कार्तिक', 'मंसिर', 'पुस', 'माघ', 'फागुन', 'चैत',
      ]
      const englishMonths = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ]
      const englishDays = [
        'Sunday', 'Monday', 'Tuesday', 'Wednesday',
        'Thursday', 'Friday', 'Saturday',
      ]

      const toNepaliNum = (n: number) => {
        const nums = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९']
        return String(n).split('').map(d => nums[parseInt(d)] ?? d).join('')
      }

      const hours = now.getHours()
      const minutes = now.getMinutes()
      const seconds = now.getSeconds()

      const time = [
        String(hours).padStart(2, '0'),
        String(minutes).padStart(2, '0'),
        String(seconds).padStart(2, '0'),
      ].join(':')

      const englishDate = `${englishDays[now.getDay()]}, ${englishMonths[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`
      const bsYear = now.getFullYear() + 56
      const nepaliDate = `${nepaliMonths[now.getMonth()]} ${toNepaliNum(now.getDate())}, ${toNepaliNum(bsYear)}`

      setDateTime({
        day: nepaliDays[now.getDay()],
        nepaliDate,
        englishDate,
        time,
      })
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  return dateTime
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const { nepaliDate, englishDate, time, day } = useNepaliDateTime()

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">

      {/* Combined Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 flex-shrink-0">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-nepal-blue to-nepal-red rounded-xl flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-lg">
                ने
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
                  GN Nepal
                </h1>
                <p className="text-xs text-gray-500 nepali-text hidden sm:block">
                  विश्वभरका समाचार नेपालीमा
                </p>
              </div>
            </Link>

            {/* Center: Dates + Time */}
            <div className="hidden lg:flex flex-col items-center text-center gap-0.5">
              <p className="text-xs font-semibold text-nepal-blue nepali-text">
                {day}, {nepaliDate}
              </p>
              <p className="text-xs text-gray-500">
                {englishDate}
              </p>
              <p className="text-sm font-bold text-gray-800 font-mono tracking-widest">
                🕐 {time} <span className="text-xs font-normal text-gray-400">NPT</span>
              </p>
            </div>

            {/* Right: Social + LIVE + Search + Menu */}
            <div className="flex items-center gap-2 md:gap-3">
              <div className="hidden md:flex items-center gap-2">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition">
                  <Facebook className="w-4 h-4" />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition">
                  <Youtube className="w-4 h-4" />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 bg-gray-900 hover:bg-black text-white rounded-full flex items-center justify-center transition">
                  <Twitter className="w-4 h-4" />
                </a>
              </div>

              <div className="hidden md:block w-px h-6 bg-gray-200" />

              <div className="flex items-center gap-1.5 bg-red-600 text-white px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                <span className="text-xs font-bold tracking-wide">LIVE</span>
              </div>

              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
                aria-label="Search"
              >
                <Search className="w-5 h-5 text-gray-600" />
              </button>

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-full transition"
                aria-label="Menu"
              >
                {isMenuOpen
                  ? <X className="w-6 h-6 text-gray-600" />
                  : <Menu className="w-6 h-6 text-gray-600" />
                }
              </button>
            </div>
          </div>

          {/* Search Bar */}
          {isSearchOpen && (
            <div className="pb-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="समाचार खोज्नुहोस्..."
                  className="w-full px-4 py-3 pr-32 border-2 border-gray-200 rounded-xl focus:border-nepal-blue focus:outline-none nepali-text text-sm"
                  autoFocus
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-nepal-blue text-white rounded-lg hover:bg-nepal-blue/90 transition text-sm nepali-text">
                  खोज्नुहोस्
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden md:block bg-gradient-to-r from-nepal-blue to-nepal-red">
        <div className="container mx-auto px-4">
          <ul className="flex items-center justify-center">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={category.slug}
                  className="flex items-center gap-1.5 px-3 py-3 text-white/90 hover:text-white hover:bg-white/10 transition font-medium nepali-text text-sm"
                >
                  <span className="text-base">{category.icon}</span>
                  <span>{category.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-semibold text-nepal-blue nepali-text">
              {day}, {nepaliDate}
            </p>
            <p className="text-xs text-gray-500">{englishDate}</p>
            <p className="text-xs font-mono text-gray-700">🕐 {time} NPT</p>
          </div>
          <ul className="py-1">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={category.slug}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition nepali-text"
                >
                  <span className="text-xl">{category.icon}</span>
                  <span className="font-medium">{category.name}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="px-4 py-3 border-t border-gray-100 flex gap-3">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
              <Facebook className="w-4 h-4" /> Facebook
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-600 text-white rounded-lg text-sm font-medium">
              <Youtube className="w-4 h-4" /> YouTube
            </a>
          </div>
        </div>
      )}
    </header>
  )
}