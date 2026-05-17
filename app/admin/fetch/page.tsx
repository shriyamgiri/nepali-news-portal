'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function FetchPage() {
  const [fetching, setFetching] = useState(false)
  const [translating, setTranslating] = useState(false)
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
    setFetching(true)
    setResult(null)
    try {
      const response = await fetch('/api/cron')
      const data = await response.json()
      setResult({ type: 'both', data })
    } catch (error: any) {
      setResult({ type: 'error', message: error.message })
    } finally {
      setFetching(false)
    }
  }

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
          disabled={fetching}
          className="px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium"
        >
          {fetching ? '⏳ Fetching...' : '📰 Fetch News Only'}
        </button>

        <button
          onClick={handleTranslate}
          disabled={translating}
          className="px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-medium"
        >
          {translating ? '⏳ Translating...' : '🌐 Translate Only'}
        </button>

        <button
          onClick={handleBoth}
          disabled={fetching || translating}
          className="px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition font-medium"
        >
          {fetching ? '⏳ Processing...' : '🚀 Fetch + Translate'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-bold mb-4">Results</h2>
          <pre className="bg-gray-50 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-bold text-blue-900 mb-2">ℹ️ How it works:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Fetch News Only:</strong> Gets latest articles from all active sources</li>
          <li>• <strong>Translate Only:</strong> Translates fetched articles to Nepali</li>
          <li>• <strong>Fetch + Translate:</strong> Does both automatically</li>
        </ul>
      </div>
    </div>
  )
}