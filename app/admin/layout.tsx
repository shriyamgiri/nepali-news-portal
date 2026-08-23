'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Globe, FileText, MessageSquare, TrendingUp, LogOut, DollarSign } from 'lucide-react'
import { LayoutDashboard, Globe, FileText, MessageSquare, TrendingUp, LogOut, Settings } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Skip auth check on login page
    if (pathname === '/admin/login') {
      setLoading(false)
      return
    }

    // Check for session token in cookie
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop()?.split(';').shift()
      return null
    }

    const token = getCookie('admin_session')
    
    if (!token) {
      console.log('No session found, redirecting to login')
      router.push('/admin/login')
      return
    }

    console.log('Session found, authenticated')
    setIsAuthenticated(true)
    setLoading(false)
  }, [pathname, router])

  const handleLogout = () => {
    if (confirm('Logout from admin panel?')) {
      // Clear cookie
      document.cookie = 'admin_session=; path=/; max-age=0'
      
      // Redirect to login
      router.push('/admin/login')
    }
  }

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  // Show login page without admin layout
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  // Show nothing if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/sources', label: 'News Sources', icon: Globe },
    { href: '/admin/articles', label: 'Articles', icon: FileText },
    { href: '/admin/comments', label: 'Comments', icon: MessageSquare },
    { href: '/admin/fetch', label: 'Fetch & Translate', icon: TrendingUp },
    { href: '/admin/advertisements', label: 'Advertisements', icon: DollarSign },
    { href: '/admin/trending', label: 'Trending Topics', icon: TrendingUp },
    { href: '/admin/facebook', label: 'Facebook', icon: Globe },
    { href: '/admin/config', label: 'Editorial Settings', icon: Settings },
  ]

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/admin" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-red-600 rounded-lg flex items-center justify-center text-white font-bold">
                  ने
                </div>
                <span className="text-xl font-bold text-gray-800">नेपाल खबर Admin</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 transition hidden sm:block">
                ← Back to Website
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:block">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-6">
          <aside className="col-span-12 md:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-24">
              <nav className="space-y-1">
                {navItems.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition font-medium text-sm ${
                      isActive(href)
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                  </Link>
                ))}
                <div className="pt-3 mt-3 border-t border-gray-100">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition text-sm font-medium"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </nav>
            </div>
          </aside>
          <main className="col-span-12 md:col-span-9">{children}</main>
        </div>
      </div>
    </div>
  )
}