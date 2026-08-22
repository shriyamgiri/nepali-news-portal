export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
// ✅ supabaseAdmin bypasses RLS — needed to read admin_users table
import { supabaseAdmin as supabase } from '@/app/lib/supabase'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (error || !admin) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const passwordHash = Buffer.from(password).toString('base64')
    if (admin.password_hash !== passwordHash) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id)

    const token = Buffer.from(`${admin.id}:${admin.email}:${Date.now()}`).toString('base64')

    const response = NextResponse.json({
      success: true,
      token,
      user: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
    })

    response.cookies.set('admin_session', token, {
      httpOnly: false,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   60 * 60 * 24 * 7,
      path:     '/',
    })

    return response

  } catch (err: any) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.set('admin_session', '', {
    httpOnly: false, secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', maxAge: 0, path: '/',
  })
  return response
}