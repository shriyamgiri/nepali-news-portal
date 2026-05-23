'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/app/lib/supabase'
import {
  Plus, Edit2, Trash2, Eye, MousePointer,
  Upload, Image, Video, Code, ToggleLeft,
  ToggleRight, ExternalLink, DollarSign, X
} from 'lucide-react'

interface Ad {
  id: string
  title: string
  type: string
  position: string
  file_url: string | null
  html_content: string | null
  click_url: string | null
  is_active: boolean
  is_adsense: boolean
  adsense_slot_id: string | null
  start_date: string | null
  end_date: string | null
  view_count: number
  click_count: number
  created_at: string
}

const POSITIONS = [
  { value: 'header',         label: 'Header Banner',       size: '728×90',  desc: 'Top of every page' },
  { value: 'sidebar-top',    label: 'Sidebar Top',         size: '300×250', desc: 'Top of sidebar' },
  { value: 'sidebar-bottom', label: 'Sidebar Bottom',      size: '300×250', desc: 'Bottom of sidebar' },
  { value: 'infeed-1',       label: 'In-Feed (Home)',      size: '100%',    desc: 'Between articles on homepage' },
  { value: 'article-bottom', label: 'Article Bottom',      size: '336×280', desc: 'Below each article' },
  { value: 'breaking-below', label: 'Below Breaking News', size: '728×90',  desc: 'Under breaking news ticker' },
]

const AD_TYPES = [
  { value: 'image',   label: 'Image',   icon: Image,  accept: 'image/*' },
  { value: 'video',   label: 'Video',   icon: Video,  accept: 'video/*' },
  { value: 'html',    label: 'HTML',    icon: Code,   accept: null },
  { value: 'adsense', label: 'AdSense', icon: DollarSign, accept: null },
]

export default function AdvertisementsPage() {
  const [ads, setAds]               = useState<Ad[]>([])
  const [loading, setLoading]       = useState(true)
  const [showModal, setShowModal]   = useState(false)
  const [editingAd, setEditingAd]   = useState<Ad | null>(null)
  const [deleteId, setDeleteId]     = useState<string | null>(null)
  const [uploading, setUploading]   = useState(false)
  const [saving, setSaving]         = useState(false)
  const [activeTab, setActiveTab]   = useState('all')
  const fileRef                     = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title: '', type: 'image', position: 'header',
    file_url: '', html_content: '', click_url: '',
    adsense_slot_id: '', is_active: true,
    start_date: '', end_date: '',
  })

  useEffect(() => { fetchAds() }, [])

  async function fetchAds() {
    setLoading(true)
    const { data } = await supabase
      .from('ads')
      .select('*')
      .order('created_at', { ascending: false })
    setAds(data || [])
    setLoading(false)
  }

  function openAdd() {
    setEditingAd(null)
    setForm({
      title: '', type: 'image', position: 'header',
      file_url: '', html_content: '', click_url: '',
      adsense_slot_id: '', is_active: true,
      start_date: '', end_date: '',
    })
    setShowModal(true)
  }

  function openEdit(ad: Ad) {
    setEditingAd(ad)
    setForm({
      title:           ad.title,
      type:            ad.is_adsense ? 'adsense' : ad.type,
      position:        ad.position,
      file_url:        ad.file_url || '',
      html_content:    ad.html_content || '',
      click_url:       ad.click_url || '',
      adsense_slot_id: ad.adsense_slot_id || '',
      is_active:       ad.is_active,
      start_date:      ad.start_date?.split('T')[0] || '',
      end_date:        ad.end_date?.split('T')[0] || '',
    })
    setShowModal(true)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const ext      = file.name.split('.').pop()
      const filename = `ad_${Date.now()}.${ext}`
      const { data, error } = await supabase.storage
        .from('ad-files')
        .upload(filename, file, { upsert: true })
      if (error) throw error
      const { data: urlData } = supabase.storage
        .from('ad-files')
        .getPublicUrl(data.path)
      setForm(f => ({ ...f, file_url: urlData.publicUrl }))
    } catch (err: any) {
      alert('Upload failed: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    if (!form.title.trim())    { alert('Please enter an ad title'); return }
    if (!form.position)        { alert('Please select a position'); return }
    if (form.type !== 'adsense' && form.type !== 'html' && !form.file_url) {
      alert('Please upload a file'); return
    }
    setSaving(true)
    try {
      const payload = {
        title:           form.title.trim(),
        type:            form.type === 'adsense' ? 'adsense' : form.type,
        position:        form.position,
        file_url:        form.file_url || null,
        html_content:    form.html_content || null,
        click_url:       form.click_url || null,
        is_active:       form.is_active,
        is_adsense:      form.type === 'adsense',
        adsense_slot_id: form.type === 'adsense' ? form.adsense_slot_id : null,
        start_date:      form.start_date || null,
        end_date:        form.end_date   || null,
        updated_at:      new Date().toISOString(),
      }
      if (editingAd) {
        await supabase.from('ads').update(payload).eq('id', editingAd.id)
      } else {
        await supabase.from('ads').insert({ ...payload, view_count: 0, click_count: 0 })
      }
      setShowModal(false)
      fetchAds()
    } catch (err: any) {
      alert('Save failed: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    await supabase.from('ads').delete().eq('id', deleteId)
    setDeleteId(null)
    fetchAds()
  }

  async function toggleActive(ad: Ad) {
    await supabase.from('ads').update({ is_active: !ad.is_active }).eq('id', ad.id)
    fetchAds()
  }

  const filtered = ads.filter(a => {
    if (activeTab === 'all')     return true
    if (activeTab === 'active')  return a.is_active
    if (activeTab === 'paused')  return !a.is_active
    if (activeTab === 'adsense') return a.is_adsense
    return true
  })

  const totalViews  = ads.reduce((s, a) => s + (a.view_count  || 0), 0)
  const totalClicks = ads.reduce((s, a) => s + (a.click_count || 0), 0)
  const ctr         = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : '0.00'

  const posLabel = (pos: string) => POSITIONS.find(p => p.value === pos)?.label || pos

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advertisements</h1>
          <p className="text-gray-500 mt-1">Manage direct ads and Google AdSense slots</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          <Plus className="w-4 h-4" /> Add Advertisement
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Ads',    value: ads.length,                        color: 'text-blue-600',   bg: 'bg-blue-50' },
          { label: 'Active',       value: ads.filter(a => a.is_active).length, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Total Views',  value: totalViews.toLocaleString(),        color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Total Clicks', value: totalClicks.toLocaleString(),       color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg border border-gray-200 p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{s.label}</p>
              <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
            <div className={`w-12 h-12 ${s.bg} rounded-lg flex items-center justify-center text-2xl`}>
              {s.label === 'Total Ads' ? '📢' : s.label === 'Active' ? '✅' : s.label === 'Total Views' ? '👁️' : '🖱️'}
            </div>
          </div>
        ))}
      </div>

      {/* CTR Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-5 text-white flex items-center justify-between">
        <div>
          <p className="text-blue-200 text-sm font-medium">Overall Click-Through Rate (CTR)</p>
          <p className="text-4xl font-bold mt-1">{ctr}%</p>
          <p className="text-blue-200 text-sm mt-1">{totalClicks} clicks from {totalViews} impressions</p>
        </div>
        <div className="text-6xl opacity-30">📊</div>
      </div>

      {/* AdSense Guide */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h3 className="font-bold text-yellow-800 mb-2">How to Earn with Google AdSense</h3>
            <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
              <li>Make sure you have <strong>20+ published articles</strong> on your portal</li>
              <li>Apply at <a href="https://adsense.google.com" target="_blank" className="underline font-medium">adsense.google.com</a> using your portal URL</li>
              <li>Wait for Google approval (usually 2–4 weeks)</li>
              <li>After approval, get your <strong>Publisher ID</strong> (ca-pub-XXXXXXXX) and <strong>Ad Slot IDs</strong></li>
              <li>Add an AdSense ad slot here using those IDs</li>
              <li>Google automatically fills your ad slots and pays you monthly</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Ad Positions Overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-bold text-gray-900 mb-4">Ad Position Map</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {POSITIONS.map(pos => {
            const ad = ads.find(a => a.position === pos.value && a.is_active)
            return (
              <div key={pos.value} className={`border-2 rounded-lg p-3 ${ad ? 'border-green-400 bg-green-50' : 'border-dashed border-gray-300 bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-600">{pos.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${ad ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                    {ad ? '● Active' : '○ Empty'}
                  </span>
                </div>
                <p className="text-xs text-gray-400">{pos.desc}</p>
                <p className="text-xs font-mono text-gray-400 mt-1">{pos.size}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tabs + Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 px-5 pt-4 flex gap-1">
          {['all', 'active', 'paused', 'adsense'].map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition capitalize ${
                activeTab === t
                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t} ({t === 'all' ? ads.length : t === 'active' ? ads.filter(a => a.is_active).length : t === 'paused' ? ads.filter(a => !a.is_active).length : ads.filter(a => a.is_adsense).length})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"/>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">📢</div>
            <p className="text-gray-500 font-medium">No advertisements yet</p>
            <p className="text-gray-400 text-sm mt-1">Click "Add Advertisement" to create your first ad</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Preview', 'Title & Position', 'Type', 'Stats', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(ad => (
                  <tr key={ad.id} className="hover:bg-gray-50 transition">

                    {/* Preview */}
                    <td className="px-5 py-4">
                      <div className="w-20 h-14 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
                        {ad.file_url && ad.type === 'image' ? (
                          <img src={ad.file_url} alt={ad.title} className="w-full h-full object-cover"/>
                        ) : ad.file_url && ad.type === 'video' ? (
                          <video src={ad.file_url} className="w-full h-full object-cover" muted/>
                        ) : ad.is_adsense ? (
                          <span className="text-xs text-center text-gray-400 font-medium p-1">AdSense</span>
                        ) : (
                          <span className="text-2xl">📋</span>
                        )}
                      </div>
                    </td>

                    {/* Title */}
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">{ad.title}</p>
                      <p className="text-xs text-blue-600 mt-0.5">{posLabel(ad.position)}</p>
                      {ad.click_url && (
                        <a href={ad.click_url} target="_blank" className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 mt-0.5">
                          <ExternalLink className="w-3 h-3"/> Link
                        </a>
                      )}
                    </td>

                    {/* Type */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        ad.is_adsense         ? 'bg-yellow-100 text-yellow-700' :
                        ad.type === 'image'   ? 'bg-blue-100 text-blue-700' :
                        ad.type === 'video'   ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {ad.is_adsense ? '💰 AdSense' : ad.type === 'image' ? '🖼 Image' : ad.type === 'video' ? '🎬 Video' : '📝 HTML'}
                      </span>
                    </td>

                    {/* Stats */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="flex items-center gap-1 text-gray-500">
                          <Eye className="w-3.5 h-3.5"/> {(ad.view_count || 0).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1 text-gray-500">
                          <MousePointer className="w-3.5 h-3.5"/> {(ad.click_count || 0).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        CTR: {ad.view_count > 0 ? ((ad.click_count / ad.view_count) * 100).toFixed(1) : '0.0'}%
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <button onClick={() => toggleActive(ad)} className="flex items-center gap-2 group">
                        {ad.is_active ? (
                          <><ToggleRight className="w-8 h-8 text-green-500 group-hover:text-green-600"/>
                          <span className="text-xs text-green-600 font-medium">Active</span></>
                        ) : (
                          <><ToggleLeft className="w-8 h-8 text-gray-400 group-hover:text-gray-500"/>
                          <span className="text-xs text-gray-400 font-medium">Paused</span></>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(ad)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                          <Edit2 className="w-4 h-4"/>
                        </button>
                        <button onClick={() => setDeleteId(ad.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── ADD / EDIT MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">

            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{editingAd ? 'Edit Ad' : 'Add New Advertisement'}</h2>
                <p className="text-sm text-gray-400 mt-0.5">Fill in the details below</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="w-5 h-5 text-gray-400"/>
              </button>
            </div>

            <div className="p-6 space-y-5">

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ad Title <span className="text-red-500">*</span></label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Himalayan Bank - Homepage Banner"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Position <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-2">
                  {POSITIONS.map(p => (
                    <button
                      key={p.value}
                      onClick={() => setForm(f => ({ ...f, position: p.value }))}
                      className={`text-left px-3 py-2 rounded-lg border text-sm transition ${
                        form.position === p.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <div className="font-medium">{p.label}</div>
                      <div className="text-xs opacity-70">{p.desc} · {p.size}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ad Type <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-4 gap-2">
                  {AD_TYPES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setForm(f => ({ ...f, type: t.value }))}
                      className={`flex flex-col items-center gap-1 py-3 rounded-lg border text-xs font-medium transition ${
                        form.type === t.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-500'
                      }`}
                    >
                      <t.icon className="w-5 h-5"/>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* File Upload — for image/video */}
              {(form.type === 'image' || form.type === 'video') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Upload {form.type === 'image' ? 'Image' : 'Video'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={fileRef}
                    type="file"
                    accept={form.type === 'image' ? 'image/*' : 'video/*'}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {form.file_url ? (
                    <div className="border-2 border-green-400 rounded-lg p-3 bg-green-50">
                      {form.type === 'image' ? (
                        <img src={form.file_url} alt="Preview" className="w-full h-32 object-contain rounded"/>
                      ) : (
                        <video src={form.file_url} className="w-full h-32 rounded" controls muted/>
                      )}
                      <button
                        onClick={() => setForm(f => ({ ...f, file_url: '' }))}
                        className="mt-2 text-xs text-red-500 hover:underline"
                      >
                        Remove & upload different file
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition disabled:opacity-60"
                    >
                      {uploading ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"/>
                          <span className="text-sm text-gray-500">Uploading...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="w-8 h-8 text-gray-400"/>
                          <span className="text-sm font-medium text-gray-600">Click to upload {form.type}</span>
                          <span className="text-xs text-gray-400">
                            {form.type === 'image' ? 'JPG, PNG, GIF, WebP' : 'MP4, WebM, MOV'}
                          </span>
                        </div>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* HTML Content */}
              {form.type === 'html' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">HTML Content <span className="text-red-500">*</span></label>
                  <textarea
                    value={form.html_content}
                    onChange={e => setForm(f => ({ ...f, html_content: e.target.value }))}
                    placeholder='<a href="https://..."><img src="..." /></a>'
                    rows={5}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* AdSense */}
              {form.type === 'adsense' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-yellow-800 font-semibold">
                    <DollarSign className="w-5 h-5"/> Google AdSense Setup
                  </div>
                  <p className="text-xs text-yellow-700">
                    After AdSense approval, enter your slot ID below. Format: <code className="bg-yellow-100 px-1 rounded">1234567890</code>
                  </p>
                  <div>
                    <label className="block text-xs font-medium text-yellow-800 mb-1">AdSense Slot ID</label>
                    <input
                      value={form.adsense_slot_id}
                      onChange={e => setForm(f => ({ ...f, adsense_slot_id: e.target.value }))}
                      placeholder="e.g. 1234567890"
                      className="w-full px-3 py-2 border border-yellow-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  <p className="text-xs text-yellow-600">
                    Your Publisher ID goes in <code className="bg-yellow-100 px-1 rounded">next.config.js</code> — see documentation below.
                  </p>
                </div>
              )}

              {/* Click URL */}
              {form.type !== 'adsense' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Click URL (where ad links to)</label>
                  <input
                    value={form.click_url}
                    onChange={e => setForm(f => ({ ...f, click_url: e.target.value }))}
                    placeholder="https://advertiser-website.com"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
                  <input
                    type="date" value={form.start_date}
                    onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
                  <input
                    type="date" value={form.end_date}
                    onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-700">Activate Immediately</p>
                  <p className="text-xs text-gray-400">Ad will show on website right away</p>
                </div>
                <button
                  onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${form.is_active ? 'bg-blue-600' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-7' : 'translate-x-1'}`}/>
                </button>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-100">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition font-medium text-sm">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition font-medium text-sm flex items-center justify-center gap-2">
                {saving ? <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"/> Saving...</> : (editingAd ? '✓ Save Changes' : '+ Add Ad')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🗑️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Ad?</h3>
            <p className="text-gray-500 text-sm mb-6">This will permanently remove the advertisement and all its stats.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition font-medium text-sm">Keep</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
