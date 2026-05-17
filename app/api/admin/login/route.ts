import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // Fetch admin user
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    if (error || !admin) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password (simple base64 check)
    const passwordHash = Buffer.from(password).toString('base64')

    if (admin.password_hash !== passwordHash) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Update last login
    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id)

    // Create session token
    const token = Buffer.from(`${admin.id}:${admin.email}:${Date.now()}`).toString('base64')

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      }
    })
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}