import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import bcrypt from 'bcryptjs'

const SESSION_COOKIE = 'admin_session'
const SESSION_VALUE  = 'khabar_admin_authenticated' // simple token
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7             // 7 days

// ── POST /api/admin/auth  →  Login ──
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      )
    }

    // Look up admin user in DB
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('id, name, email, password_hash, role')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (error || !admin) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      )
    }

    // Compare password with stored hash
    const passwordMatch = await bcrypt.compare(password, admin.password_hash)

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      )
    }

    // Build success response with session cookie
    const response = NextResponse.json({
      success: true,
      admin: {
        id:    admin.id,
        name:  admin.name,
        email: admin.email,
        role:  admin.role,
      },
    })

    // Set secure httpOnly cookie
    response.cookies.set(SESSION_COOKIE, SESSION_VALUE, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   COOKIE_MAX_AGE,
      path:     '/',
    })

    return response

  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}

// ── DELETE /api/admin/auth  →  Logout ──
export async function DELETE() {
  const response = NextResponse.json({ success: true })

  // Clear the session cookie
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   0,   // Expire immediately
    path:     '/',
  })

  return response
}
