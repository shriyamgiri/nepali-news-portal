'use client'

import { useState } from 'react'

export default function TestFetch() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleFetch = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/fetch-news', {
        method: 'POST',
      })
      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Test News Fetcher</h1>
        
        <button
          onClick={handleFetch}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Fetching...' : 'Fetch News Now'}
        </button>

        {result && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Results:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}