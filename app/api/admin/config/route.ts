export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/app/lib/supabase'

// GET - Fetch all config
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('editorial_config')
      .select('*')
      .order('category')

    if (error) throw error

    // Convert to key-value object grouped by category
    const config: Record<string, any> = {}
    data?.forEach(item => {
      config[item.config_key] = {
        value: item.config_value,
        description: item.description,
        category: item.category,
        updated_at: item.updated_at,
      }
    })

    return NextResponse.json({ 
      success: true,
      config,
      raw: data 
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH - Update config value
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { config_key, config_value, updated_by } = body

    if (!config_key || config_value === undefined) {
      return NextResponse.json(
        { error: 'config_key and config_value required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('editorial_config')
      .update({
        config_value: String(config_value),
        updated_by: updated_by || 'admin',
        updated_at: new Date().toISOString(),
      })
      .eq('config_key', config_key)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, config: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Bulk update multiple configs
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { updates } = body // Array of { config_key, config_value }

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'updates array required' },
        { status: 400 }
      )
    }

    const results = []
    for (const update of updates) {
      const { data, error } = await supabase
        .from('editorial_config')
        .update({
          config_value: String(update.config_value),
          updated_by: 'admin',
          updated_at: new Date().toISOString(),
        })
        .eq('config_key', update.config_key)
        .select()
        .single()

      if (!error) results.push(data)
    }

    return NextResponse.json({ 
      success: true, 
      updated: results.length 
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}