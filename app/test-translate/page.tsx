'use client'

import { useState } from 'react'

export default function TestTranslate() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleTranslate = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/translate', {
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
        <h1 className="text-3xl font-bold mb-6">Test AI Translation</h1>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700">
            This will translate up to 10 untranslated articles from English to Nepali using Gemini AI.
          </p>
        </div>

        <button
          onClick={handleTranslate}
          disabled={loading}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium"
        >
          {loading ? 'Translating... (may take 30-60 seconds)' : 'Translate Articles to Nepali'}
        </button>

        {result && (
          <div className="mt-6 space-y-4">
            {result.summary && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">Summary:</h2>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-blue-50 p-4 rounded">
                    <div className="text-2xl font-bold text-blue-600">
                      {result.summary.total_processed}
                    </div>
                    <div className="text-sm text-gray-600">Processed</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded">
                    <div className="text-2xl font-bold text-green-600">
                      {result.summary.successful}
                    </div>
                    <div className="text-sm text-gray-600">Success</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded">
                    <div className="text-2xl font-bold text-red-600">
                      {result.summary.failed}
                    </div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Detailed Results:</h2>
              <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}