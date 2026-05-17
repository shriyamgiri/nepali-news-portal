import { supabase } from '../lib/supabase'
import Link from 'next/link'

export default async function AdminDashboard() {
  // Fetch stats from database
  const { count: sourcesCount } = await supabase
    .from('sources')
    .select('*', { count: 'exact', head: true })
  
  const { count: articlesCount } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })
  
  const { count: pendingCount } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')
  
  const { data: activeSources } = await supabase
    .from('sources')
    .select('*')
    .eq('is_active', true)

  const { data: recentArticles } = await supabase
    .from('articles')
    .select(`
      id,
      nepali_title,
      original_title,
      status,
      created_at,
      view_count
    `)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your news portal</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Sources</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{activeSources?.length || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Total: {sourcesCount || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🌐</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Articles</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{articlesCount || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Published & Fetched</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Comments</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{pendingCount || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Awaiting moderation</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💬</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/admin/sources"
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-center font-medium"
          >
            📌 Add Source
          </Link>
          <Link
            href="/admin/fetch"
            className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-center font-medium"
          >
            🔄 Fetch News
          </Link>
          <Link
            href="/admin/articles"
            className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-center font-medium"
          >
            📄 View Articles
          </Link>
          <Link
            href="/admin/comments"
            className="px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-center font-medium"
          >
            ✅ Moderate
          </Link>
        </div>
      </div>

      {/* Recent Articles */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Articles</h2>
        {recentArticles && recentArticles.length > 0 ? (
          <div className="space-y-3">
            {recentArticles.map((article) => (
              <div key={article.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 nepali-text line-clamp-1">
                    {article.nepali_title || article.original_title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(article.created_at).toLocaleString()} • {article.view_count} views
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-4 ${
                  article.status === 'published' ? 'bg-green-100 text-green-800' :
                  article.status === 'translating' ? 'bg-yellow-100 text-yellow-800' :
                  article.status === 'fetched' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {article.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No articles yet</p>
            <Link href="/admin/fetch" className="text-blue-600 hover:underline mt-2 inline-block">
              Fetch your first articles →
            </Link>
          </div>
        )}
      </div>

      {/* Active Sources Preview */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Active News Sources</h2>
          <Link href="/admin/sources" className="text-blue-600 hover:underline text-sm">
            Manage all →
          </Link>
        </div>
        {activeSources && activeSources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeSources.slice(0, 4).map((source) => (
              <div key={source.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🌐</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{source.name}</h4>
                  <p className="text-xs text-gray-500">{source.language}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No active sources</p>
            <Link href="/admin/sources" className="text-blue-600 hover:underline mt-2 inline-block">
              Add news sources →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}