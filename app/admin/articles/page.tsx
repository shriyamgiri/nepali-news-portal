export const dynamic = 'force-dynamic'

'use client'
import { useState, useEffect } from 'react'
import { FileText, Eye, Trash2, RefreshCw, Search, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface Article {
  id: string
  original_title: string
  nepali_title: string | null
  nepali_summary: string | null
  original_language: string
  original_url: string
  image_url: string | null
  status: string
  view_count: number
  like_count: number
  comment_count: number
  published_at: string | null
  created_at: string
  categories?: { name_en: string; name_ne: string }
  sources?: { name: string }
}

export default function ArticlesManagement() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [retryingId, setRetryingId] = useState<string | null>(null)

  useEffect(() => {
    loadArticles()
  }, [statusFilter])

  const loadArticles = async () => {
    setLoading(true)
    try {
      const url = statusFilter === 'all' ? '/api/admin/articles?limit=100' : `/api/admin/articles?status=${statusFilter}&limit=100`
      const response = await fetch(url)
      const data = await response.json()
      setArticles(data.articles || [])
    } catch (error) {
      console.error('Error loading articles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete: "${title}"?`)) return
    setDeletingId(id)
    try {
      const response = await fetch(`/api/admin/articles?id=${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed')
      setArticles(articles.filter(a => a.id !== id))
      alert('✅ Deleted!')
    } catch (error) {
      alert('❌ Failed to delete')
    } finally {
      setDeletingId(null)
    }
  }

  const handleRetryTranslation = async (id: string, title: string) => {
    if (!confirm(`Retry translation for: "${title}"?`)) return
    setRetryingId(id)
    try {
      await fetch('/api/translate', { method: 'POST' })
      alert('✅ Translation triggered!')
      setTimeout(() => loadArticles(), 3000)
    } catch (error) {
      alert('❌ Failed')
    } finally {
      setRetryingId(null)
    }
  }

  const filtered = articles.filter(a => (a.nepali_title || '').toLowerCase().includes(searchTerm.toLowerCase()) || (a.original_title || '').toLowerCase().includes(searchTerm.toLowerCase()) || (a.sources?.name || '').toLowerCase().includes(searchTerm.toLowerCase()))
  const stats = { all: articles.length, published: articles.filter(a => a.status === 'published').length, fetched: articles.filter(a => a.status === 'fetched').length, translating: articles.filter(a => a.status === 'translating').length, failed: articles.filter(a => a.status === 'failed').length }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Articles Management</h1>
        <p className="text-gray-600 mt-1">Manage all news articles • {stats.all} total</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.all}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Published</p>
          <p className="text-2xl font-bold text-green-600">{stats.published}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Fetched</p>
          <p className="text-2xl font-bold text-blue-600">{stats.fetched}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Translating</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.translating}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Failed</p>
          <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex gap-2 flex-wrap">
            {['all', 'published', 'fetched', 'failed'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`px-4 py-2 rounded-lg font-medium transition ${statusFilter === s ? (s === 'all' ? 'bg-gray-900 text-white' : s === 'published' ? 'bg-green-600 text-white' : s === 'fetched' ? 'bg-blue-600 text-white' : 'bg-red-600 text-white') : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                {s.charAt(0).toUpperCase() + s.slice(1)} ({stats[s as keyof typeof stats]})
              </button>
            ))}
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Search articles..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" />
          </div>
        </div>
      </div>
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">No articles found</h3>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((article) => (
            <div key={article.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex gap-4">
                {article.image_url && <img src={article.image_url} alt="" className="w-32 h-24 object-cover rounded-lg flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1 nepali-text">{article.nepali_title || article.original_title}</h3>
                      {article.nepali_title && article.nepali_title !== article.original_title && <p className="text-sm text-gray-500 mb-2">Original: {article.original_title}</p>}
                      {article.nepali_summary && <p className="text-sm text-gray-600 line-clamp-2 nepali-text">{article.nepali_summary}</p>}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${article.status === 'published' ? 'bg-green-100 text-green-800' : article.status === 'translating' ? 'bg-yellow-100 text-yellow-800' : article.status === 'fetched' ? 'bg-blue-100 text-blue-800' : article.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{article.status.toUpperCase()}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                    <span>📰 {article.sources?.name || 'Unknown'}</span>
                    <span>🏷️ {article.categories?.name_ne || 'Uncategorized'}</span>
                    <span>👁 {article.view_count} views</span>
                    <span>💬 {article.comment_count} comments</span>
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                    <Link href={`/news/${article.id}`} target="_blank" className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition">
                      <Eye className="w-4 h-4" />View
                    </Link>
                    {article.original_url && <a href={article.original_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg transition"><ExternalLink className="w-4 h-4" />Original</a>}
                    {(article.status === 'fetched' || article.status === 'failed') && <button onClick={() => handleRetryTranslation(article.id, article.original_title)} disabled={retryingId === article.id} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition disabled:opacity-50"><RefreshCw className={`w-4 h-4 ${retryingId === article.id ? 'animate-spin' : ''}`} />Retry</button>}
                    <button onClick={() => handleDelete(article.id, article.nepali_title || article.original_title)} disabled={deletingId === article.id} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition disabled:opacity-50 ml-auto"><Trash2 className="w-4 h-4" />Delete</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}