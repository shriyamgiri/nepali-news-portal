import { supabase } from './supabase'

// Fetch all articles with their category and source info
export async function getArticles(limit = 20) {
  console.log('🔍 Fetching articles... limit:', limit)

  const { data, error } = await supabase
    .from('articles')
    .select(`
      *,
      categories (
        name_en,
        name_ne,
        slug,
        icon
      ),
      sources (
        name,
        website_url
      )
    `)
    .eq('status', 'published')
    .not('nepali_title', 'is', null)
    .order('priority_score', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(limit)

  console.log('✅ Articles found:', data?.length || 0)
  

  if (error) {
    console.error('❌ Error fetching articles:', error)
    return []
  }

  return data || []
}

// Fetch trending articles (most views)
export async function getTrendingArticles(limit = 5) {
  const { data, error } = await supabase
    .from('articles')
    .select(`
      id,
      nepali_title,
      view_count,
      published_at
    `)
    .eq('status', 'published')
    .not('nepali_title', 'is', null)
    .order('view_count', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching trending articles:', error)
    return []
  }

  return data || []
}

// Fetch articles by category — fixed: 2-step query, no !inner join
export async function getArticlesByCategory(categorySlug: string, limit = 4) {
  // Step 1: Get category ID from slug
  const { data: category, error: catError } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', categorySlug)
    .single()

  if (catError || !category) {
    console.error('Category not found:', categorySlug)
    return []
  }

  // Step 2: Fetch articles by category_id directly
  const { data, error } = await supabase
    .from('articles')
    .select(`
      *,
      categories (
        name_en,
        name_ne,
        slug,
        icon
      ),
      sources (
        name
      )
    `)
    .eq('category_id', category.id)
    .eq('status', 'published')
    .not('nepali_title', 'is', null)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching articles by category:', error)
    return []
  }

  return data || []
}

// Get single article by ID
export async function getArticleById(id: string) {
  const { data, error } = await supabase
    .from('articles')
    .select(`
      *,
      categories (
        name_en,
        name_ne,
        slug,
        icon
      ),
      sources (
        name,
        website_url
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching article:', error)
    return null
  }

  // Increment view count
  if (data) {
    await supabase
      .from('articles')
      .update({ view_count: data.view_count + 1 })
      .eq('id', id)
  }

  return data
}

// Get all categories
export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order')

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  return data || []
}

// Get article reactions count
export async function getReactionCounts(articleId: string) {
  const { data, error } = await supabase
    .from('reactions')
    .select('reaction_type')
    .eq('article_id', articleId)

  if (error) {
    console.error('Error fetching reactions:', error)
    return { like: 0, love: 0, wow: 0, sad: 0, angry: 0 }
  }

  const counts = { like: 0, love: 0, wow: 0, sad: 0, angry: 0 }

  data?.forEach(reaction => {
    if (reaction.reaction_type in counts) {
      counts[reaction.reaction_type as keyof typeof counts]++
    }
  })

  return counts
}

// Get approved comments for article
export async function getComments(articleId: string) {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('article_id', articleId)
    .eq('status', 'approved')
    .is('parent_comment_id', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching comments:', error)
    return []
  }

  return data || []
}

// Add a new comment
export async function addComment(
  articleId: string,
  name: string,
  email: string,
  text: string,
  userIp?: string
) {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      article_id: articleId,
      commenter_name: name,
      commenter_email: email,
      comment_text: text,
      user_ip: userIp,
      status: 'pending'
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding comment:', error)
    return null
  }

  return data
}

// Add a reaction
export async function addReaction(
  articleId: string,
  reactionType: string,
  userIp: string
) {
  const { data, error } = await supabase
    .from('reactions')
    .insert({
      article_id: articleId,
      reaction_type: reactionType,
      user_ip: userIp
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      await supabase
        .from('reactions')
        .delete()
        .eq('article_id', articleId)
        .eq('user_ip', userIp)
        .eq('reaction_type', reactionType)
    }
    return null
  }

  return data
}