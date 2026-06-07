'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabase'
import { Plus, Trash2, Edit2, TrendingUp, X } from 'lucide-react'

interface Topic {
  id:         string
  keyword:    string
  keyword_ne: string | null
  source:     string
  priority:   number
  is_active:  boolean
}

const PRIORITY_LABELS: Record<number, { label: string; color: string }> = {
  10: { label: 'Critical',  color: 'bg-red-100 text-red-700' },
  9:  { label: 'Very High', color: 'bg-orange-100 text-orange-700' },
  8:  { label: 'High',      color: 'bg-yellow-100 text-yellow-700' },
  7:  { label: 'Medium',    color: 'bg-blue-100 text-blue-700' },
  6:  { label: 'Normal',    color: 'bg-gray-100 text-gray-700' },
  5:  { label: 'Low',       color: 'bg-gray-100 text-gray-500' },
}

export default function TrendingTopicsPage() {
  const [topics,    setTopics]    = useState<Topic[]>([])
  const [loading,   setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing,   setEditing]   = useState<Topic | null>(null)
  const [saving,    setSaving]    = useState(false)

  const [form, setForm] = useState({
    keyword: '', keyword_ne: '', priority: 7, is_active: true,
  })

  useEffect(() => { fetchTopics() }, [])

  async function fetchTopics() {
    setLoading(true)
    const { data } = await supabase
      .from('trending_topics')
      .select('*')
      .order('priority', { ascending: false })
    setTopics(data || [])
    setLoading(false)
  }

  function openAdd() {
    setEditing(null)
    setForm({ keyword: '', keyword_ne: '', priority: 7, is_active: true })
    setShowModal(true)
  }

  function openEdit(t: Topic) {
    setEditing(t)
    setForm({ keyword: t.keyword, keyword_ne: t.keyword_ne || '', priority: t.priority, is_active: t.is_active })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.keyword.trim()) { alert('Enter a keyword'); return }
    setSaving(true)
    const payload = {
      keyword:    form.keyword.trim(),
      keyword_ne: form.keyword_ne.trim() || null,
      priority:   form.priority,
      is_active:  form.is_active,
      source:     'manual',
      updated_at: new Date().toISOString(),
    }
    if (editing) {
      await supabase.from('trending_topics').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('trending_topics').insert(payload)
    }
    setSaving(false)
    setShowModal(false)
    fetchTopics()
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this topic?')) return
    await supabase.from('trending_topics').delete().eq('id', id)
    fetchTopics()
  }

  async function toggleActive(t: Topic) {
    await supabase.from('trending_topics').update({ is_active: !t.is_active }).eq('id', t.id)
    fetchTopics()
  }

  const manualTopics = topics.filter(t => t.source === 'manual')
  const autoTopics   = topics.filter(t => t.source === 'auto')
  const activeCount  = topics.filter(t => t.is_active).length

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-orange-500" /> Trending Topics
          </h1>
          <p className="text-gray-500 mt-1">
            Control what news gets fetched. System only fetches articles matching these keywords.
          </p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
          <Plus className="w-4 h-4" /> Add Topic
        </button>
      </div>

      {/* How It Works */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
        <h3 className="font-bold text-orange-900 mb-2">🧠 How Smart Fetching Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm text-orange-800">
          <div className="bg-white rounded-lg p-3 border border-orange-100">
            <div className="text-xl mb-1">📡</div>
            <div className="font-semibold">Scan Sources</div>
            <div className="text-xs text-orange-600 mt-1">All RSS feeds scanned but nothing stored yet</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-orange-100">
            <div className="text-xl mb-1">🔍</div>
            <div className="font-semibold">Match Keywords</div>
            <div className="text-xs text-orange-600 mt-1">Only articles matching your topics pass the filter</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-orange-100">
            <div className="text-xl mb-1">⭐</div>
            <div className="font-semibold">Score & Pick Top 10</div>
            <div className="text-xs text-orange-600 mt-1">Best 10 unique stories selected — duplicates removed</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-orange-100">
            <div className="text-xl mb-1">🌐</div>
            <div className="font-semibold">Translate & Publish</div>
            <div className="text-xs text-orange-600 mt-1">Only these 10 translated — Gemini quota stays safe</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
          <div className="text-3xl font-bold text-blue-600">{topics.length}</div>
          <div className="text-sm text-gray-500 mt-1">Total Topics</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
          <div className="text-3xl font-bold text-green-600">{activeCount}</div>
          <div className="text-sm text-gray-500 mt-1">Active Topics</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
          <div className="text-3xl font-bold text-orange-600">{autoTopics.length}</div>
          <div className="text-sm text-gray-500 mt-1">Auto-Detected</div>
        </div>
      </div>

      {/* Manual Topics */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">✏️ Manual Topics ({manualTopics.length})</h2>
          <p className="text-xs text-gray-400">You control these — add/edit/remove anytime</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full"/>
          </div>
        ) : manualTopics.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <div className="text-4xl mb-2">🔍</div>
            <p>No manual topics yet. Add your first one!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {manualTopics.map(t => (
              <div key={t.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50">

                {/* Active toggle */}
                <button onClick={() => toggleActive(t)}
                  className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${t.is_active ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${t.is_active ? 'translate-x-5' : 'translate-x-0.5'}`}/>
                </button>

                {/* Keyword */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{t.keyword}</span>
                    {t.keyword_ne && (
                      <span className="text-sm text-gray-500 nepali-text">{t.keyword_ne}</span>
                    )}
                  </div>
                </div>

                {/* Priority */}
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${PRIORITY_LABELS[t.priority]?.color || 'bg-gray-100 text-gray-600'}`}>
                  {PRIORITY_LABELS[t.priority]?.label || 'Normal'} ({t.priority})
                </span>

                {/* Actions */}
                <div className="flex gap-1">
                  <button onClick={() => openEdit(t)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition">
                    <Edit2 className="w-4 h-4"/>
                  </button>
                  <button onClick={() => handleDelete(t.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition">
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Auto-detected topics */}
      {autoTopics.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">🤖 Auto-Detected Topics ({autoTopics.length})</h2>
            <p className="text-xs text-gray-400 mt-0.5">Detected when 3+ sources cover the same topic — updated each fetch cycle</p>
          </div>
          <div className="flex flex-wrap gap-2 p-5">
            {autoTopics.map(t => (
              <span key={t.id} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${t.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                🔥 {t.keyword}
                <button onClick={() => toggleActive(t)} className="ml-1 opacity-60 hover:opacity-100">
                  {t.is_active ? '●' : '○'}
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Priority Guide */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <h3 className="font-semibold text-gray-700 mb-3">Priority Guide</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(PRIORITY_LABELS).reverse().map(([score, info]) => (
            <div key={score} className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${info.color}`}>{info.label}</span>
              <span className="text-xs text-gray-500">= {score} points per match</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Higher priority topics = articles about them score higher = more likely to be in Top 10
        </p>
      </div>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">

            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">{editing ? 'Edit Topic' : 'Add Trending Topic'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400"/>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Keyword (English) <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.keyword}
                  onChange={e => setForm(f => ({ ...f, keyword: e.target.value }))}
                  placeholder="e.g. IPL, War, Olympics, Bitcoin"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Keyword (Nepali) <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  value={form.keyword_ne}
                  onChange={e => setForm(f => ({ ...f, keyword_ne: e.target.value }))}
                  placeholder="e.g. आईपीएल, युद्ध, ओलम्पिक"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority: <span className="font-bold text-blue-600">{form.priority} — {PRIORITY_LABELS[form.priority]?.label}</span>
                </label>
                <input
                  type="range" min="5" max="10" value={form.priority}
                  onChange={e => setForm(f => ({ ...f, priority: parseInt(e.target.value) }))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Low (5)</span><span>Critical (10)</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-700">Active</p>
                  <p className="text-xs text-gray-400">System will filter articles using this keyword</p>
                </div>
                <button
                  onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${form.is_active ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-7' : 'translate-x-1'}`}/>
                </button>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition text-sm font-medium">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition text-sm font-medium flex items-center justify-center gap-2">
                {saving ? <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"/> Saving...</> : (editing ? '✓ Save' : '+ Add Topic')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}