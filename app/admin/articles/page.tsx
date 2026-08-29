'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import {
  FileText, Eye, Trash2, RefreshCw,
  Search, ExternalLink, Clock, ChevronDown,
  History,
} from 'lucide-react'
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
  translated_at: string | null
  created_at: string
  batch_id: string | null
  batch_time: string | null
  priority_score: number | null
  is_breaking: boolean
  nepal_related: boolean
  categories?: { name_en: string; name_ne: string }
  sources?: { name: string }
}

interface Counts {
  total: number
  published: number
  fetched: number
  failed: number
  translating: number
  backlog: number
}

const TIME_RANGES = [
  { label: 'Last 30 mins', value: '30m' },
  { label: 'Last 1 hour', value: '1h' },
  { label: 'Last 3 hours', value: '3h' },
  { label: 'Last 6 hours', value: '6h' },
  { label: 'Last 12 hours', value: '12h' },
  { label: 'Last 24 hours', value: '24h' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
]

const STATUS_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Published', value: 'published' },
  { label: 'Fetched', value: 'fetched' },
  { label: 'Backlog', value: 'backlog' },
  { label: 'Translating', value: 'translating' },
  { label: 'Failed', value: 'failed' },
]

function formatNPT(dateStr: string | null): string {
  if (!dateStr) return '—'
  const date = new Date(new Date(dateStr).toLocaleString('en-US', { timeZone: 'Asia/Kathmandu' }))
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const day = date.getDate().toString().padStart(2, '0')
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  const hours = date.getHours()
  const mins = date.getMinutes().toString().padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const h12 = (hours % 12 || 12).toString().padStart(2, '0')
  return `${day}-${month}-${year}, ${h12}:${mins} ${ampm} NPT`
}

function formatBatchTime(dateStr: string | null): string {
  if (!dateStr) return '—'
  const date = new Date(new Date(dateStr).toLocaleString('en-US', { timeZone: 'Asia/Kathmandu' }))
  const hours = date.getHours()
  const mins = date.getMinutes().toString().padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const h12 = hours % 12 || 12
  return `${h12}:${mins} ${ampm}`
}

function getScoreColor(score: number | null) {
  if (!score) return 'bg-gray-100 text-gray-600'
  if (score >= 70) return 'bg-green-100 text-green-700'
  if (score >= 40) return 'bg-yellow-100 text-yellow-700'
  return 'bg-gray-100 text-gray-600'
}

function getArticleLabel(article: Article, currentBatchId: string | null) {
  if (article.status === 'published') return 'published'
  if (article.status === 'translating') return 'translating'
  if (article.status === 'failed') return 'failed'
  if (article.status === 'fetched') {
    if (currentBatchId && article.batch_id !== currentBatchId) return 'backlog'
    return 'fetched'
  }
  return article.status
}

export default function ArticlesManagement() {
  const [articles, setArticles] = useState<Article[]>([])
  const [counts, setCounts] = useState<Counts>({ total: 0, published: 0, fetched: 0, failed: 0, translating: 0, backlog: 0 })
  const [currentBatch, setCurrentBatch] = useState<{ batch_id: string; batch_time: string } | null>(null)
  const [prevBatch, setPrevBatch] = useState<{ batch_id: string; batch_time: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [timeRange, setTimeRange] = useState('24h')
  const [searchTerm, setSearchTerm] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [retryingId, setRetryingId] = useState<string | null>(null)
  const [timeOpen, setTimeOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)

  const loadArticles = useCallback(async () => {
    setLoading(true)
    try {
      const url = `/api/admin/articles?status=${statusFilter}&timeRange=${timeRange}&limit=100`
      const res = await fetch(url)
      const data = await res.json()
      setArticles(data.articles || [])
      setCounts(data.counts || {})
      setCurrentBatch(data.currentBatch || null)
      setPrevBatch(data.previousBatch || null)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, timeRange])

  useEffect(() => { loadArticles() }, [loadArticles])

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete: "${title}"?`)) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/articles?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      setArticles(prev => prev.filter(a => a.id !== id))
    } catch {
      alert('❌ Failed to delete')
    } finally {
      setDeletingId(null)
    }
  }

  const handleRetry = async (id: string, title: string) => {
    if (!confirm(`Retry translation for: "${title}"?`)) return
    setRetryingId(id)
    try {
      await fetch('/api/translate', { method: 'POST' })
      alert('✅ Translation triggered!')
      setTimeout(loadArticles, 3000)
    } catch {
      alert('❌ Failed')
    } finally {
      setRetryingId(null)
    }
  }

  const filtered = articles.filter(a =>
    (a.nepali_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.original_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.sources?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const timeLabel = TIME_RANGES.find(t => t.value === timeRange)?.label || 'Last 24 hours'
  const statusLabel = STATUS_OPTIONS.find(s => s.value === statusFilter)?.label || 'All'

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Articles Management</h1>
          <p className="text-gray-600 mt-1">{timeLabel} · {filtered.length} articles shown</p>
        </div>
        <button
          onClick={loadArticles}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: counts.total, color: 'text-gray-900' },
          { label: 'Published', value: counts.published, color: 'text-green-600' },
          { label: 'Fetched', value: counts.fetched, color: 'text-blue-600' },
          { label: 'Backlog', value: counts.backlog, color: 'text-yellow-600' },
          { label: 'Translating', value: counts.translating, color: 'text-orange-500' },
          { label: 'Failed', value: counts.failed, color: 'text-red-600' },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            onClick={() => setStatusFilter(label.toLowerCase())}
            className={`bg-white rounded-xl p-4 border cursor-pointer transition hover:shadow-sm ${statusFilter === label.toLowerCase()
                ? 'border-blue-400 ring-1 ring-blue-200'
                : 'border-gray-200'
              }`}
          >
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Batch Banner */}
      {(currentBatch || prevBatch) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <History className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <span className="font-semibold text-amber-800">Pipeline batch status: </span>
            {currentBatch && (
              <span className="text-amber-700">
                {currentBatch && (
                  <span className="text-amber-700">
                    Current batch ({formatBatchTime(currentBatch.batch_time)}) active
                    {prevBatch && ' · '}
                  </span>
                )}
                {prevBatch ? (
                  <span className="text-amber-700">
                    Previous batch ({formatBatchTime(prevBatch.batch_time)}) —{' '}
                    {counts.backlog} articles in backlog, will be compared and cleaned on next run
                  </span>
                ) : (
                  <span className="text-amber-700"> · No previous batch backlog</span>
                )}
              </span>
            )}
            {prevBatch ? (
              <span className="text-amber-700">
                Previous batch ({formatBatchTime(prevBatch.batch_time)}) —{' '}
                {counts.backlog} articles in backlog, will be compared and cleaned on next run
              </span>
            ) : (
              <span className="text-amber-700">No previous batch backlog</span>
            )}
          </div>
          {counts.backlog > 0 && (
            <span className="bg-amber-600 text-white text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap">
              {counts.backlog} backlog
            </span>
          )}
        </div>
      )}

      {/* Filters Row */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-3">

          {/* Time Range Dropdown */}
          <div className="relative">
            <button
              onClick={() => { setTimeOpen(!timeOpen); setStatusOpen(false) }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium min-w-[160px] justify-between"
            >
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                {timeLabel}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${timeOpen ? 'rotate-180' : ''}`} />
            </button>
            {timeOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 min-w-[180px]">
                {TIME_RANGES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => { setTimeRange(t.value); setTimeOpen(false) }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition ${timeRange === t.value ? 'text-blue-600 font-medium bg-blue-50' : 'text-gray-700'
                      }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <button
              onClick={() => { setStatusOpen(!statusOpen); setTimeOpen(false) }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium min-w-[140px] justify-between"
            >
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                {statusLabel}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${statusOpen ? 'rotate-180' : ''}`} />
            </button>
            {statusOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 min-w-[160px]">
                {STATUS_OPTIONS.map(s => (
                  <button
                    key={s.value}
                    onClick={() => { setStatusFilter(s.value); setStatusOpen(false) }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition flex items-center justify-between ${statusFilter === s.value ? 'text-blue-600 font-medium bg-blue-50' : 'text-gray-700'
                      }`}
                  >
                    <span>{s.label}</span>
                    <span className="text-xs text-gray-400 ml-4">
                      {s.value === 'all' ? counts.total :
                        s.value === 'published' ? counts.published :
                          s.value === 'fetched' ? counts.fetched :
                            s.value === 'backlog' ? counts.backlog :
                              s.value === 'translating' ? counts.translating :
                                s.value === 'failed' ? counts.failed : ''}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title or source..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>

          <div className="flex items-center text-sm text-gray-500 whitespace-nowrap">
            {filtered.length} results
          </div>
        </div>
      </div>

      {/* Article List */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading articles...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No articles found for this filter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(article => {
            const label = getArticleLabel(article, currentBatch?.batch_id || null)
            const isBacklog = label === 'backlog'
            const timestamp = article.status === 'published'
              ? `Published ${formatNPT(article.translated_at || article.published_at)}`
              : `Fetched ${formatNPT(article.created_at)}`

            return (
              <div
                key={article.id}
                className={`bg-white rounded-xl border p-5 transition hover:shadow-sm ${isBacklog
                    ? 'border-l-4 border-l-amber-400 border-gray-200'
                    : article.is_breaking
                      ? 'border-l-4 border-l-red-500 border-gray-200'
                      : 'border-gray-200'
                  }`}
              >
                <div className="flex gap-4">

                  {/* Image */}
                  {article.image_url ? (
                    <img
                      src={article.image_url}
                      alt=""
                      className="w-28 h-20 object-cover rounded-lg flex-shrink-0"
                      onError={e => { e.currentTarget.style.display = 'none' }}
                    />
                  ) : (
                    <div className="w-28 h-20 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                      <FileText className="w-8 h-8 text-gray-300" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">

                    {/* Title + Badges */}
                    <div className="flex items-start gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 nepali-text">
                          {article.nepali_title || article.original_title}
                        </p>
                        {article.nepali_title && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                            {article.original_title}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0 flex-wrap justify-end">
                        {article.is_breaking && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium border border-red-200">
                            Breaking
                          </span>
                        )}
                        {article.nepal_related && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                            🇳🇵 Nepal
                          </span>
                        )}
                        <span className={`px-2.5 py-0.5 text-xs rounded-full font-medium ${label === 'published' ? 'bg-green-100  text-green-700  border border-green-200' :
                            label === 'backlog' ? 'bg-amber-100  text-amber-700  border border-amber-200' :
                              label === 'fetched' ? 'bg-blue-100   text-blue-700   border border-blue-200' :
                                label === 'translating' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                  label === 'failed' ? 'bg-red-100    text-red-700    border border-red-200' :
                                    'bg-gray-100 text-gray-700'
                          }`}>
                          {label.charAt(0).toUpperCase() + label.slice(1)}
                        </span>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mb-2">
                      <span>📰 {article.sources?.name || 'Unknown'}</span>
                      <span>🏷️ {article.categories?.name_ne || 'Uncategorized'}</span>
                      <span>👁 {article.view_count} views</span>
                      {article.priority_score !== null && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getScoreColor(article.priority_score)}`}>
                          Score: {article.priority_score}{isBacklog ? ' (decayed)' : ''}
                        </span>
                      )}
                      {isBacklog && (
                        <span className="flex items-center gap-1 text-amber-600 font-medium">
                          <History className="w-3 h-3" />
                          Backlog from {formatBatchTime(article.batch_time)}
                        </span>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                      <Clock className="w-3 h-3" />
                      {timestamp}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                      <Link
                        href={`/news/${article.id}`}
                        target="_blank"
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </Link>
                      {article.original_url && (
                        <a
                          href={article.original_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Original
                        </a>
                      )}
                    {(article.status === 'fetched' || article.status === 'failed' || isBacklog) && (
                      <button
                        onClick={() => handleRetry(article.id, article.original_title)}
                        disabled={retryingId === article.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${retryingId === article.id ? 'animate-spin' : ''}`} />
                        Retry
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(article.id, article.nepali_title || article.original_title)}
                      disabled={deletingId === article.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition disabled:opacity-50 ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </div>
              </div>
      )
      })}
    </div>
  )
}
    </div >
  )
}