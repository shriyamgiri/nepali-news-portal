'use client'

import Link from 'next/link'
import { Search, Menu, X, Globe } from 'lucide-react'
import { useState } from 'react'
import AdSlot from './AdSlot'
// Add inside your header, below the nav:
<AdSlot position="header" className="w-full my-2" />

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

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

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-nepal-blue to-nepal-red text-white">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center text-sm">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span>विश्वभरका समाचार नेपालीमा</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:inline">आइतबार, वैशाख २, २०८२</span>
            <span className="text-xs bg-white/20 px-2 py-1 rounded">LIVE</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-nepal-blue to-nepal-red rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg">
              ने
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 nepali-text">
                GN Nepal
              </h1>
              <p className="text-xs text-gray-500">विश्वभरका समाचार नेपालीमा</p>
            </div>
          </Link>

          {/* Desktop Search & Menu Toggle */}
          <div className="flex items-center gap-4">
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
              {isMenuOpen ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {isSearchOpen && (
          <div className="mt-4 animate-fadeIn">
            <div className="relative">
              <input
                type="text"
                placeholder="समाचार खोज्नुहोस्..."
                className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-lg focus:border-nepal-blue focus:outline-none nepali-text"
                autoFocus
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-nepal-blue text-white rounded-md hover:bg-nepal-blue/90 transition">
                खोज्नुहोस्
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation - Desktop */}
      <nav className="hidden md:block border-t border-gray-200 bg-gray-50">
        <div className="container mx-auto px-4">
          <ul className="flex items-center justify-center gap-1 py-1">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={category.slug}
                  className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:text-nepal-blue hover:bg-white rounded-md transition font-medium nepali-text"
                >
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <nav className="md:hidden border-t border-gray-200 bg-white animate-slideDown">
          <ul className="py-2">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={category.slug}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition nepali-text font-medium"
                >
                  <span className="text-xl">{category.icon}</span>
                  <span>{category.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}

export default Header
