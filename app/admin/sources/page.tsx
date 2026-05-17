'use client'

export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, RefreshCw, Globe, CheckCircle, XCircle, Search } from 'lucide-react'

interface Source {
  id: string
  name: string
  website_url: string
  rss_feed_url: string | null
  language: string
  category: string | null
  country: string | null
  is_active: boolean
  fetch_interval_minutes: number
  credibility_score: number
  last_fetched_at: string | null
  created_at: string
}

export default function SourcesManagement() {
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingSource, setEditingSource] = useState<Source | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [fetchingId, setFetchingId] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    website_url: '',
    rss_feed_url: '',
    language: 'en',
    category: 'General',
    country: '',
    is_active: true,
    fetch_interval_minutes: 30,
    credibility_score: 5,
  })

  // Load sources on mount
  useEffect(() => {
    loadSources()
  }, [])

  const loadSources = async () => {
    try {
      const response = await fetch('/api/admin/sources')
      const data = await response.json()
      setSources(data.sources || [])
    } catch (error) {
      console.error('Error loading sources:', error)
      alert('Failed to load sources')
    } finally {
      setLoading(false)
    }
  }

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/admin/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Failed to add source')

      const data = await response.json()
      setSources([data.source, ...sources])
      setShowAddModal(false)
      resetForm()
      alert('✅ Source added successfully!')
    } catch (error) {
      console.error('Error adding source:', error)
      alert('❌ Failed to add source')
    }
  }

  const handleUpdateSource = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingSource) return

    try {
      const response = await fetch('/api/admin/sources', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingSource.id, ...formData }),
      })

      if (!response.ok) throw new Error('Failed to update source')

      const data = await response.json()
      setSources(sources.map(s => s.id === editingSource.id ? data.source : s))
      setEditingSource(null)
      resetForm()
      alert('✅ Source updated successfully!')
    } catch (error) {
      console.error('Error updating source:', error)
      alert('❌ Failed to update source')
    }
  }

  const handleDeleteSource = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will also delete all articles from this source.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/sources?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete source')

      setSources(sources.filter(s => s.id !== id))
      alert('✅ Source deleted successfully!')
    } catch (error) {
      console.error('Error deleting source:', error)
      alert('❌ Failed to delete source')
    }
  }

  const handleToggleActive = async (source: Source) => {
    try {
      const response = await fetch('/api/admin/sources', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: source.id, 
          is_active: !source.is_active 
        }),
      })

      if (!response.ok) throw new Error('Failed to toggle source')

      const data = await response.json()
      setSources(sources.map(s => s.id === source.id ? data.source : s))
    } catch (error) {
      console.error('Error toggling source:', error)
      alert('❌ Failed to toggle source')
    }
  }

  const handleFetchSource = async (sourceId: string, sourceName: string) => {
    setFetchingId(sourceId)
    
    try {
      // Note: This would require a new API endpoint to fetch single source
      // For now, we'll use the general fetch
      const response = await fetch('/api/fetch-news', {
        method: 'POST',
      })

      if (!response.ok) throw new Error('Failed to fetch')

      alert(`✅ Fetch triggered for ${sourceName}! Check articles page in a moment.`)
      loadSources() // Reload to update last_fetched_at
    } catch (error) {
      console.error('Error fetching source:', error)
      alert('❌ Failed to trigger fetch')
    } finally {
      setFetchingId(null)
    }
  }

  const openAddModal = () => {
    resetForm()
    setShowAddModal(true)
  }

  const openEditModal = (source: Source) => {
    setFormData({
      name: source.name,
      website_url: source.website_url,
      rss_feed_url: source.rss_feed_url || '',
      language: source.language,
      category: source.category || 'General',
      country: source.country || '',
      is_active: source.is_active,
      fetch_interval_minutes: source.fetch_interval_minutes,
      credibility_score: source.credibility_score,
    })
    setEditingSource(source)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      website_url: '',
      rss_feed_url: '',
      language: 'en',
      category: 'General',
      country: '',
      is_active: true,
      fetch_interval_minutes: 30,
      credibility_score: 5,
    })
  }

  const filteredSources = sources.filter(source =>
    source.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    source.website_url.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activeCount = sources.filter(s => s.is_active).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">News Sources</h1>
          <p className="text-gray-600 mt-1">
            Manage news agencies and RSS feeds • {activeCount} active of {sources.length} total
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          <Plus className="w-5 h-5" />
          Add New Source
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search sources by name or URL..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Sources Table */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sources...</p>
        </div>
      ) : filteredSources.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
          <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">No sources found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm ? 'No sources match your search.' : 'Add your first news source to get started.'}
          </p>
          {!searchTerm && (
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-5 h-5" />
              Add First Source
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Fetch
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSources.map((source) => (
                  <tr key={source.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          source.is_active ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <Globe className={`w-5 h-5 ${
                            source.is_active ? 'text-green-600' : 'text-gray-400'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{source.name}</p>
                          <a 
                            href={source.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            {source.website_url}
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-gray-600">
                          <span className="font-medium">Language:</span> {source.language.toUpperCase()}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Credibility:</span> {source.credibility_score}/10
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Interval:</span> {source.fetch_interval_minutes} mins
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(source)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                          source.is_active
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {source.is_active ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">
                        {source.last_fetched_at 
                          ? new Date(source.last_fetched_at).toLocaleString()
                          : 'Never'
                        }
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleFetchSource(source.id, source.name)}
                          disabled={fetchingId === source.id}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition disabled:opacity-50"
                          title="Fetch now"
                        >
                          <RefreshCw className={`w-4 h-4 ${fetchingId === source.id ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                          onClick={() => openEditModal(source)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSource(source.id, source.name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingSource) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingSource ? 'Edit Source' : 'Add New Source'}
              </h2>
            </div>

            <form onSubmit={editingSource ? handleUpdateSource : handleAddSource} className="p-6 space-y-4">
              {/* Source Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., BBC Nepali"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              {/* Website URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website URL *
                </label>
                <input
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  placeholder="https://www.bbc.com/nepali"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              {/* RSS Feed URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RSS Feed URL (Optional - will auto-detect)
                </label>
                <input
                  type="url"
                  value={formData.rss_feed_url}
                  onChange={(e) => setFormData({ ...formData, rss_feed_url: e.target.value })}
                  placeholder="https://feeds.bbci.co.uk/nepali/rss.xml"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to auto-detect RSS feed from website
                </p>
              </div>

              {/* Language & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Language *
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="en">English</option>
                    <option value="ne">Nepali (नेपाली)</option>
                    <option value="hi">Hindi (हिन्दी)</option>
                    <option value="zh">Chinese</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="ar">Arabic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="General">General</option>
                    <option value="Politics">Politics</option>
                    <option value="Economy">Economy</option>
                    <option value="Sports">Sports</option>
                    <option value="Technology">Technology</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Health">Health</option>
                  </select>
                </div>
              </div>

              {/* Country & Credibility */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="e.g., Nepal, UK, USA"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Credibility Score (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.credibility_score}
                    onChange={(e) => setFormData({ ...formData, credibility_score: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Fetch Interval */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fetch Interval (minutes)
                </label>
                <select
                  value={formData.fetch_interval_minutes}
                  onChange={(e) => setFormData({ ...formData, fetch_interval_minutes: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="15">Every 15 minutes</option>
                  <option value="30">Every 30 minutes</option>
                  <option value="60">Every hour</option>
                  <option value="120">Every 2 hours</option>
                  <option value="360">Every 6 hours</option>
                  <option value="720">Every 12 hours</option>
                </select>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Active (fetch news from this source)
                </label>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingSource(null)
                    resetForm()
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  {editingSource ? 'Update Source' : 'Add Source'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}