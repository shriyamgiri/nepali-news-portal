'use client'

import { useState } from 'react'

export default function FetchPage() {
  const [fetching, setFetching] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [both, setBoth] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleFetch = async () => {
    setFetching(true)
    setResult(null)
    try {
      const response = await fetch('/api/fetch-news', { method: 'POST' })
      const data = await response.json()
      setResult({ type: 'fetch', data })
    } catch (error: any) {
      setResult({ type: 'error', message: error.message })
    } finally {
      setFetching(false)
    }
  }

  const handleTranslate = async () => {
    setTranslating(true)
    setResult(null)
    try {
      const response = await fetch('/api/translate', { method: 'POST' })
      const data = await response.json()
      setResult({ type: 'translate', data })
    } catch (error: any) {
      setResult({ type: 'error', message: error.message })
    } finally {
      setTranslating(false)
    }
  }

  const handleBoth = async () => {
    setBoth(true)
    setResult(null)
    try {
      // Step 1: Fetch
      const fetchResponse = await fetch('/api/fetch-news', { method: 'POST' })
      const fetchData = await fetchResponse.json()

      // Step 2: Translate
      const translateResponse = await fetch('/api/translate', { method: 'POST' })
      const translateData = await translateResponse.json()

      setResult({
        type: 'both',
        data: {
          fetch: fetchData.summary || fetchData,
          translate: translateData.summary || translateData,
        }
      })
    } catch (error: any) {
      setResult({ type: 'error', message: error.message })
    } finally {
      setBoth(false)
    }
  }

  const isLoading = fetching || translating || both

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Fetch & Translate</h1>
        <p className="text-gray-600 mt-1">Manually trigger news fetching and translation</p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={handleFetch}
          disabled={isLoading}
          className="px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium"
        >
          {fetching ? '⏳ Fetching...' : '📰 Fetch News Only'}
        </button>

        <button
          onClick={handleTranslate}
          disabled={isLoading}
          className="px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-medium"
        >
          {translating ? '⏳ Translating...' : '🌐 Translate Only'}
        </button>

        <button
          onClick={handleBoth}
          disabled={isLoading}
          className="px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition font-medium"
        >
          {both ? '⏳ Processing...' : '🚀 Fetch + Translate'}
        </button>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin w-5 h-5 border-2 border-yellow-600 border-t-transparent rounded-full"></div>
            <p className="text-yellow-800 font-medium">
              {fetching && 'Fetching news from all sources... (may take 30-60 seconds)'}
              {translating && 'Translating articles to Nepali... (may take 60-120 seconds)'}
              {both && 'Running full pipeline... (may take 2-3 minutes)'}
            </p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className={`rounded-lg shadow-sm p-6 border ${
          result.type === 'error'
            ? 'bg-red-50 border-red-200'
            : 'bg-white border-gray-200'
        }`}>
          <h2 className="text-lg font-bold mb-4">
            {result.type === 'error' ? '❌ Error' : '✅ Results'}
          </h2>

          {/* Summary Cards for Both */}
          {result.type === 'both' && result.data && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-bold text-blue-900 mb-2">📰 Fetch Summary</h3>
                <p className="text-sm text-blue-800">
                  Sources: {result.data.fetch?.sources_scanned || 0}
                </p>
                <p className="text-sm text-blue-800">
                  New articles: {result.data.fetch?.saved || result.data.fetch?.articles_new || 0}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-bold text-green-900 mb-2">🌐 Translate Summary</h3>
                <p className="text-sm text-green-800">
                  Processed: {result.data.translate?.total || 0}
                </p>
                <p className="text-sm text-green-800">
                  Successful: {result.data.translate?.successful || 0}
                </p>
                <p className="text-sm text-green-800">
                  Failed: {result.data.translate?.failed || 0}
                </p>
              </div>
            </div>
          )}

          {/* Summary for fetch only */}
          {result.type === 'fetch' && result.data?.summary && (
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-blue-800">Sources scanned: {result.data.summary.sources_scanned || 0}</p>
              <p className="text-sm text-blue-800">New articles saved: {result.data.summary.saved || 0}</p>
            </div>
          )}

          {/* Summary for translate only */}
          {result.type === 'translate' && result.data?.summary && (
            <div className="bg-green-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-green-800">Total processed: {result.data.summary.total || 0}</p>
              <p className="text-sm text-green-800">Successful: {result.data.summary.successful || 0}</p>
              <p className="text-sm text-green-800">Failed: {result.data.summary.failed || 0}</p>
            </div>
          )}

          {/* Raw JSON */}
          <details className="mt-2">
            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
              View raw response
            </summary>
            <pre className="bg-gray-50 p-4 rounded overflow-auto text-xs mt-2">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-bold text-blue-900 mb-2">ℹ️ How it works:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Fetch News Only:</strong> Gets latest articles from all active RSS sources</li>
          <li>• <strong>Translate Only:</strong> Translates fetched articles to Nepali using Gemini AI</li>
          <li>• <strong>Fetch + Translate:</strong> Runs complete pipeline automatically</li>
        </ul>
        <p className="text-xs text-blue-600 mt-2">
          ⏰ This runs automatically every 30 minutes via GitHub Actions
        </p>
      </div>
    </div>
  )
}