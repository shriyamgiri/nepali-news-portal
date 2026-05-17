export const dynamic = 'force-dynamic'  // ← Add this as first line

import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // ✅ FIX 1: Removed .eq('is_active', true) — was causing login to fail
    // if column doesn't exist or value is null
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (error || !admin) {
      console.error('Admin lookup error:', error)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // ✅ FIX 2: Keep existing base64 password check (matches how it was stored)
    const passwordHash = Buffer.from(password).toString('base64')

    if (admin.password_hash !== passwordHash) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Update last login timestamp
    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id)

    // Create session token
    const token = Buffer.from(
      `${admin.id}:${admin.email}:${Date.now()}`
    ).toString('base64')

    // ✅ FIX 3: Set session cookie so middleware allows access to /admin
    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id:    admin.id,
        email: admin.email,
        name:  admin.name,
        role:  admin.role,
      },
    })

    response.cookies.set('admin_session', token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   60 * 60 * 24 * 7,  // 7 days
      path:     '/',
    })

    return response

  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    )
  }
}