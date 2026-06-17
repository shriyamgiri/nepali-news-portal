// ✅ Fix — use service role for server-side operations
import { createClient } from '@supabase/supabase-js'

// For API routes (server-side) — uses service role, bypasses RLS
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // ← Full access
)

// For public frontend — uses anon key, respects RLS
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!  // ← Read only
)

// Database types (we'll expand this later)
export type Article = {
  id: string
  source_id: string
  category_id: string
  original_title: string
  original_content: string | null
  original_summary: string | null
  original_language: string
  original_url: string
  nepali_title: string | null
  nepali_content: string | null
  nepali_summary: string | null
  image_url: string | null
  author: string | null
  published_at: string | null
  status: string
  view_count: number
  like_count: number
  comment_count: number
  created_at: string
  updated_at: string
}

export type Category = {
  id: string
  name_en: string
  name_ne: string
  slug: string
  icon: string | null
  display_order: number
  is_active: boolean
  created_at: string
}

export type Source = {
  id: string
  name: string
  website_url: string
  rss_feed_url: string | null
  language: string
  category: string | null
  country: string | null
  is_active: boolean
  fetch_interval_minutes: number
  credibility_score: number
  last_fetched_at: string | null
  created_at: string
  updated_at: string
}