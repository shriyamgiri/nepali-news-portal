'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabase'
import { ExternalLink, RefreshCw, CheckCircle, XCircle, Facebook } from 'lucide-react'

interface FbPost {
  id: string
  article_id: string
  fb_post_id: string | null
  post_message: string
  status: string
  error_message: string | null
  posted_at: string
  articles?: { nepali_title: string; original_title: string }
}

export default function FacebookPage() {
  const [posts, setPosts]         = useState<FbPost[]>([])
  const [loading, setLoading]     = useState(true)
  const [posting, setPosting]     = useState(false)
  const [result, setResult]       = useState<any>(null)
  const [configured, setConfigured] = useState<boolean | null>(null)

  useEffect(() => {
    fetchPosts()
    checkConfig()
  }, [])

  async function checkConfig() {
    const res  = await fetch('/api/facebook/status')
    const data = await res.json()
    setConfigured(data.configured)
  }

  async function fetchPosts() {
    setLoading(true)
    const { data } = await supabase
      .from('facebook_posts')
      .select('*, articles(nepali_title, original_title)')
      .order('posted_at', { ascending: false })
      .limit(50)
    setPosts(data || [])
    setLoading(false)
  }

  async function handlePostNow() {
    setPosting(true)
    setResult(null)
    try {
      const res  = await fetch('/api/facebook/post', { method: 'POST' })
      const data = await res.json()
      setResult(data)
      fetchPosts()
    } catch (err: any) {
      setResult({ error: err.message })
    } finally {
      setPosting(false)
    }
  }

  const successCount = posts.filter(p => p.status === 'success').length
  const failCount    = posts.filter(p => p.status === 'failed').length

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <span className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Facebook className="w-6 h-6 text-white"/>
            </span>
            Facebook Auto-Post
          </h1>
          <p className="text-gray-500 mt-1">Automatically publish articles to your Facebook Page</p>
        </div>
        <button
          onClick={handlePostNow}
          disabled={posting || !configured}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
        >
          {posting ? (
            <><RefreshCw className="w-4 h-4 animate-spin"/> Posting...</>
          ) : (
            <><Facebook className="w-4 h-4"/> Post Now</>
          )}
        </button>
      </div>

      {/* Config Status */}
      {configured === false && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <h3 className="font-bold text-red-800 mb-2">⚠️ Facebook Not Configured</h3>
          <p className="text-sm text-red-700 mb-3">
            Add these to your Vercel environment variables to enable Facebook auto-posting:
          </p>
          <div className="bg-white border border-red-200 rounded-lg p-3 font-mono text-sm space-y-1">
            <p className="text-gray-700">FACEBOOK_PAGE_ID=<span className="text-red-500">your_page_id</span></p>
            <p className="text-gray-700">FACEBOOK_PAGE_ACCESS_TOKEN=<span className="text-red-500">your_token</span></p>
          </div>
          <a
            href="https://developers.facebook.com"
            target="_blank"
            className="inline-flex items-center gap-1 mt-3 text-sm text-blue-600 hover:underline"
          >
            Get credentials at developers.facebook.com <ExternalLink className="w-3 h-3"/>
          </a>
        </div>
      )}

      {configured === true && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0"/>
          <div>
            <p className="font-medium text-green-800">Facebook Connected ✅</p>
            <p className="text-sm text-green-600">Auto-posting is active. New articles post automatically every 30 mins via cron.</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Total Posted</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{posts.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Successful</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{successCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Failed</p>
          <p className="text-3xl font-bold text-red-500 mt-1">{failCount}</p>
        </div>
      </div>

      {/* Post Result */}
      {result && (
        <div className={`rounded-xl p-4 border ${result.error ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          <p className={`font-bold mb-2 ${result.error ? 'text-red-700' : 'text-green-700'}`}>
            {result.error ? '❌ Post Failed' : '✅ Post Result'}
          </p>
          <pre className="text-xs overflow-auto bg-white rounded-lg p-3 border">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {/* Auto-post Flow */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-bold text-gray-900 mb-4">🔄 How Auto-Posting Works</h2>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { icon: '📡', label: 'RSS Fetched' },
            { icon: '→', label: '' },
            { icon: '🌐', label: 'Translated to Nepali' },
            { icon: '→', label: '' },
            { icon: '✅', label: 'Published on Website' },
            { icon: '→', label: '' },
            { icon: '📘', label: 'Auto-Posted on Facebook' },
            { icon: '→', label: '' },
            { icon: '👥', label: 'Audience Sees It' },
          ].map((step, i) => (
            step.label ? (
              <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${step.icon === '→' ? 'text-gray-400 text-lg' : 'bg-blue-50 text-blue-700'}`}>
                <span>{step.icon}</span>
                {step.label && <span>{step.label}</span>}
              </div>
            ) : (
              <span key={i} className="text-gray-400 text-xl">→</span>
            )
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-3">
          ⏱ This entire pipeline runs automatically every <strong>30 minutes</strong> via GitHub Actions.
          Zero human involvement required.
        </p>
      </div>

      {/* Posts Log */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Recent Facebook Posts</h2>
          <button onClick={fetchPosts} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            <RefreshCw className="w-3 h-3"/> Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"/>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">📘</div>
            <p className="text-gray-500">No posts yet</p>
            <p className="text-gray-400 text-sm mt-1">Click "Post Now" to start posting</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {posts.map(post => (
              <div key={post.id} className="px-5 py-4 flex items-start gap-4 hover:bg-gray-50">
                <div className={`mt-1 flex-shrink-0 ${post.status === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                  {post.status === 'success'
                    ? <CheckCircle className="w-5 h-5"/>
                    : <XCircle className="w-5 h-5"/>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate text-sm">
                    {post.articles?.nepali_title || post.articles?.original_title || 'Unknown Article'}
                  </p>
                  {post.error_message && (
                    <p className="text-xs text-red-500 mt-0.5">{post.error_message}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(post.posted_at).toLocaleString()}
                  </p>
                </div>
                {post.fb_post_id && (
                  <a
                    href={`https://facebook.com/${post.fb_post_id}`}
                    target="_blank"
                    className="flex-shrink-0 text-blue-500 hover:text-blue-700"
                  >
                    <ExternalLink className="w-4 h-4"/>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
