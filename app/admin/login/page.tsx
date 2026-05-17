'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function AdminLoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showPass, setShowPass] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!email.trim())    { setError('Please enter your email address.'); return }
    if (!password.trim()) { setError('Please enter your password.'); return }

    setLoading(true)

    try {
      const res = await fetch('/api/admin/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          email:    email.trim().toLowerCase(),
          password: password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        // ✅ Show exact error from API
        setError(data.error || 'Invalid email or password. Please try again.')
        setLoading(false)
        return
      }

      // ✅ Cookie is set by server — just redirect
      // window.location.href works on all browsers including company laptops
      window.location.href = '/admin'

    } catch (err) {
      console.error('Login error:', err)
      setError('Connection error. Please check your internet and try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-red-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-white text-2xl font-bold">GN</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">GN Nepal Admin</h1>
          <p className="text-gray-500 text-sm mt-1">विश्वभरका समाचार नेपालीमा</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Sign in to Admin Panel</h2>

          <form onSubmit={handleLogin} className="space-y-5" noValidate>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                <span className="flex-shrink-0 mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                placeholder="admin@nepalkhabar.com"
                autoComplete="email"
                autoFocus
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-60"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="text-xs text-blue-600 hover:text-blue-700 transition"
                >
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="••••••••••"
                autoComplete="current-password"
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-60"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign In →'
              )}
            </button>

          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-100"/>
            <span className="text-xs text-gray-400">Admin access only</span>
            <div className="flex-1 h-px bg-gray-100"/>
          </div>

          {/* Credentials hint */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 space-y-1">
            <p className="text-xs font-semibold text-blue-800">Default credentials:</p>
            <p className="text-xs text-blue-700 font-mono">📧 admin@nepalkhabar.com</p>
            <p className="text-xs text-blue-700 font-mono">🔑 Admin@123456</p>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-5">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 transition">
            ← Back to GN Nepal
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          © {new Date().getFullYear()} GN Nepal · विश्वभरका समाचार नेपालीमा
        </p>

      </div>
    </div>
  )
}
