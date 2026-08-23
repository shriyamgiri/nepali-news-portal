'use client'

import { useState, useEffect } from 'react'
import { Save, RefreshCw, Settings, AlertCircle } from 'lucide-react'

interface ConfigItem {
  config_key: string
  config_value: string
  description: string
  category: string
  updated_at: string
  updated_by: string
}

const CATEGORY_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  breaking_news: { label: 'Breaking News Rules', icon: '🔴', color: 'red' },
  nepal: { label: 'Nepal Content Rules', icon: '🇳🇵', color: 'blue' },
  scoring: { label: 'Article Scoring', icon: '📊', color: 'purple' },
  homepage: { label: 'Homepage Balance', icon: '🏠', color: 'green' },
  translation: { label: 'AI Translation', icon: '🌐', color: 'yellow' },
  social_media: { label: 'Social Media', icon: '📱', color: 'pink' },
}

export default function EditorialConfigPage() {
  const [configs, setConfigs] = useState<ConfigItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changes, setChanges] = useState<Record<string, string>>({})
  const [savedKeys, setSavedKeys] = useState<string[]>([])
  const [activeCategory, setActiveCategory] = useState('breaking_news')

  useEffect(() => {
    loadConfigs()
  }, [])

  const loadConfigs = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/config')
      const data = await response.json()
      setConfigs(data.raw || [])
    } catch (error) {
      console.error('Error loading configs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (key: string, value: string) => {
    setChanges(prev => ({ ...prev, [key]: value }))
  }

  const handleSaveAll = async () => {
    if (Object.keys(changes).length === 0) {
      alert('No changes to save!')
      return
    }

    setSaving(true)
    try {
      const updates = Object.entries(changes).map(([config_key, config_value]) => ({
        config_key,
        config_value,
      }))

      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })

      const data = await response.json()

      if (data.success) {
        setSavedKeys(Object.keys(changes))
        setChanges({})
        await loadConfigs()
        setTimeout(() => setSavedKeys([]), 3000)
        alert(`✅ ${data.updated} settings saved successfully!`)
      }
    } catch (error) {
      alert('❌ Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveOne = async (key: string, value: string) => {
    try {
      const response = await fetch('/api/admin/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          config_key: key, 
          config_value: value 
        }),
      })

      const data = await response.json()
      if (data.success) {
        setSavedKeys([key])
        const newChanges = { ...changes }
        delete newChanges[key]
        setChanges(newChanges)
        setTimeout(() => setSavedKeys([]), 2000)
      }
    } catch (error) {
      alert('❌ Failed to save')
    }
  }

  const getValue = (item: ConfigItem) => {
    return changes[item.config_key] !== undefined 
      ? changes[item.config_key] 
      : item.config_value
  }

  const isChanged = (key: string) => changes[key] !== undefined
  const isSaved = (key: string) => savedKeys.includes(key)

  const groupedConfigs = configs.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, ConfigItem[]>)

  const categories = Object.keys(CATEGORY_LABELS)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Editorial Settings</h1>
          <p className="text-gray-600 mt-1">
            Control how GN Nepal selects, scores and publishes news
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadConfigs}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          {Object.keys(changes).length > 0 && (
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : `Save All (${Object.keys(changes).length})`}
            </button>
          )}
        </div>
      </div>

      {/* Unsaved Changes Warning */}
      {Object.keys(changes).length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <p className="text-yellow-800 font-medium">
            You have {Object.keys(changes).length} unsaved change(s). Click "Save All" to apply.
          </p>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => {
          const info = CATEGORY_LABELS[cat]
          const hasChanges = configs
            .filter(c => c.category === cat)
            .some(c => changes[c.config_key] !== undefined)

          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{info.icon}</span>
              <span>{info.label}</span>
              {hasChanges && (
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
              )}
            </button>
          )
        })}
      </div>

      {/* Config Items */}
      {categories.map(category => {
        if (category !== activeCategory) return null
        const items = groupedConfigs[category] || []
        const info = CATEGORY_LABELS[category]

        return (
          <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="text-2xl">{info.icon}</span>
                {info.label}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Changes apply to the next pipeline run (within 30 minutes)
              </p>
            </div>

            <div className="divide-y divide-gray-100">
              {items.map(item => (
                <div key={item.config_key} className={`p-6 ${
                  isChanged(item.config_key) ? 'bg-yellow-50' : ''
                } ${isSaved(item.config_key) ? 'bg-green-50' : ''}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <label className="font-semibold text-gray-900">
                          {formatKey(item.config_key)}
                        </label>
                        {isChanged(item.config_key) && (
                          <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">
                            Modified
                          </span>
                        )}
                        {isSaved(item.config_key) && (
                          <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full">
                            ✅ Saved
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mb-3">
                        {item.description}
                      </p>

                      {/* Input based on value type */}
                      {isLongText(item.config_value) ? (
                        <textarea
                          value={getValue(item)}
                          onChange={e => handleChange(item.config_key, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm font-mono"
                          rows={3}
                        />
                      ) : isBoolean(item.config_value) ? (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleChange(
                              item.config_key, 
                              getValue(item) === 'true' ? 'false' : 'true'
                            )}
                            className={`relative w-12 h-6 rounded-full transition ${
                              getValue(item) === 'true' 
                                ? 'bg-blue-600' 
                                : 'bg-gray-300'
                            }`}
                          >
                            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition ${
                              getValue(item) === 'true' ? 'left-6' : 'left-0.5'
                            }`}></span>
                          </button>
                          <span className="text-sm text-gray-600">
                            {getValue(item) === 'true' ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      ) : (
                        <input
                          type={isNumber(item.config_value) ? 'number' : 'text'}
                          value={getValue(item)}
                          onChange={e => handleChange(item.config_key, e.target.value)}
                          className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                        />
                      )}

                      <p className="text-xs text-gray-400 mt-2">
                        Last updated: {new Date(item.updated_at).toLocaleString()} by {item.updated_by}
                      </p>
                    </div>

                    {/* Save Individual Button */}
                    {isChanged(item.config_key) && (
                      <button
                        onClick={() => handleSaveOne(
                          item.config_key, 
                          changes[item.config_key]
                        )}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm whitespace-nowrap"
                      >
                        <Save className="w-3 h-3" />
                        Save
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Helper functions
function formatKey(key: string): string {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function isLongText(value: string): boolean {
  return value.includes(',') && value.length > 50
}

function isBoolean(value: string): boolean {
  return value === 'true' || value === 'false'
}

function isNumber(value: string): boolean {
  return !isNaN(Number(value)) && value.trim() !== ''
}