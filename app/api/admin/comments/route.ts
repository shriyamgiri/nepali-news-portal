import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

// GET - Fetch all comments (not just pending)
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        articles (nepali_title, original_title)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ comments: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH - Approve/Reject comment
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, status } = body

    if (!['approved', 'rejected', 'spam'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('comments')
      .update({ 
        status,
        approved_at: status === 'approved' ? new Date().toISOString() : null
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, comment: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete comment
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Comment ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}