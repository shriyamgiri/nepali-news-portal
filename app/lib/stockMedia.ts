// ── Stock Media Provider (Pexels + Pixabay) ──

interface StockImage {
  url: string
  thumbnailUrl: string
  width: number
  height: number
  provider: 'pexels' | 'pixabay'
  sourceId: string
}

interface StockVideo {
  url: string
  thumbnailUrl: string
  width: number
  height: number
  duration: number
  provider: 'pexels' | 'pixabay'
  sourceId: string
}

const PEXELS_API_KEY  = process.env.PEXELS_API_KEY  || ''
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY || ''

// ── Category to Search Keywords Mapping ──
export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  politics:      ['government building', 'parliament', 'politics meeting'],
  economy:       ['business finance', 'stock market', 'money economy'],
  sports:        ['stadium sports', 'cricket match', 'football game'],
  tech:          ['technology computer', 'digital innovation', 'coding'],
  health:        ['hospital medical', 'doctor healthcare', 'medicine'],
  entertainment: ['concert stage', 'movie cinema', 'celebrity event'],
  world:         ['world map', 'international city', 'global news'],
  disaster:      ['flood disaster', 'earthquake damage', 'natural disaster'],
  nepal:         ['nepal mountains', 'kathmandu city', 'himalaya nepal'],
}

// ── Extract Best Keyword from Article ──
export function extractSearchKeyword(title: string, category: string): string {
  const text = title.toLowerCase()

  // Check for disaster keywords first (high priority)
  const disasterWords = ['flood', 'earthquake', 'landslide', 'disaster', 'बाढी', 'भूकम्प']
  if (disasterWords.some(w => text.includes(w))) {
    return 'natural disaster flood'
  }

  // Nepal specific
  if (text.includes('nepal') || text.includes('kathmandu') || text.includes('नेपाल')) {
    return 'nepal mountains kathmandu'
  }

  // Category based fallback
  const keywords = CATEGORY_KEYWORDS[category] || CATEGORY_KEYWORDS['world']
  return keywords[Math.floor(Math.random() * keywords.length)]
}

// ── Search Pexels for Photo ──
export async function searchPexelsPhoto(query: string): Promise<StockImage | null> {
  if (!PEXELS_API_KEY) return null

  try {
    // Random page 1-3 for variety
    const randomPage = Math.floor(Math.random() * 3) + 1

    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=10&page=${randomPage}&orientation=landscape`,
      {
        headers: { Authorization: PEXELS_API_KEY },
        signal: AbortSignal.timeout(5000),
      }
    )

    if (!response.ok) return null

    const data = await response.json()
    const photos = data.photos || []

    if (!photos.length) return null

    // Pick random photo from results for variety
    const photo = photos[Math.floor(Math.random() * photos.length)]

    if (!photo) return null

    return {
      url:          photo.src.large,
      thumbnailUrl: photo.src.medium,
      width:        photo.width,
      height:       photo.height,
      provider:     'pexels',
      sourceId:     String(photo.id),
    }
  } catch (err) {
    console.error('Pexels photo search failed:', err)
    return null
  }
}

// ── Search Pexels for Video ──
export async function searchPexelsVideo(query: string, portrait = false): Promise<StockVideo | null> {
  if (!PEXELS_API_KEY) return null

  try {
    const orientation = portrait ? 'portrait' : 'landscape'
    const response = await fetch(
      `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=5&orientation=${orientation}`,
      {
        headers: { Authorization: PEXELS_API_KEY },
        signal: AbortSignal.timeout(5000),
      }
    )

    if (!response.ok) return null

    const data  = await response.json()
    const video = data.videos?.[0]

    if (!video) return null

    // Get HD file
    const hdFile = video.video_files.find((f: any) =>
      f.quality === 'hd' && (portrait ? f.height > f.width : f.width > f.height)
    ) || video.video_files[0]

    return {
      url:          hdFile.link,
      thumbnailUrl: video.image,
      width:        hdFile.width,
      height:       hdFile.height,
      duration:     video.duration,
      provider:     'pexels',
      sourceId:     String(video.id),
    }
  } catch (err) {
    console.error('Pexels video search failed:', err)
    return null
  }
}

// ── Search Pixabay for Photo (Fallback) ──
export async function searchPixabayPhoto(query: string): Promise<StockImage | null> {
  if (!PIXABAY_API_KEY) return null

  try {
    const response = await fetch(
      `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&per_page=5&safesearch=true`,
      { signal: AbortSignal.timeout(5000) }
    )

    if (!response.ok) return null

    const data  = await response.json()
    const photo = data.hits?.[0]

    if (!photo) return null

    return {
      url:          photo.largeImageURL,
      thumbnailUrl: photo.webformatURL,
      width:        photo.imageWidth,
      height:       photo.imageHeight,
      provider:     'pixabay',
      sourceId:     String(photo.id),
    }
  } catch (err) {
    console.error('Pixabay photo search failed:', err)
    return null
  }
}

// ── Search Pixabay for Video (Fallback) ──
export async function searchPixabayVideo(query: string): Promise<StockVideo | null> {
  if (!PIXABAY_API_KEY) return null

  try {
    const response = await fetch(
      `https://pixabay.com/api/videos/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&per_page=5&safesearch=true`,
      { signal: AbortSignal.timeout(5000) }
    )

    if (!response.ok) return null

    const data  = await response.json()
    const video = data.hits?.[0]

    if (!video) return null

    const file = video.videos?.medium || video.videos?.small

    if (!file) return null

    return {
      url:          file.url,
      thumbnailUrl: video.userImageURL || '',
      width:        file.width,
      height:       file.height,
      duration:     video.duration,
      provider:     'pixabay',
      sourceId:     String(video.id),
    }
  } catch (err) {
    console.error('Pixabay video search failed:', err)
    return null
  }
}

// ── Main Function: Get Best Image with Fallback ──
export async function getStockImage(
  title: string,
  category: string
): Promise<StockImage | null> {
  const keyword = extractSearchKeyword(title, category)

  // Try Pexels first
  let result = await searchPexelsPhoto(keyword)

  // Fallback to Pixabay
  if (!result) {
    result = await searchPixabayPhoto(keyword)
  }

  return result
}

// ── Main Function: Get Best Video with Fallback ──
export async function getStockVideo(
  category: string,
  portrait = true
): Promise<StockVideo | null> {
  const keywords = CATEGORY_KEYWORDS[category] || CATEGORY_KEYWORDS['world']
  const keyword  = keywords[0]

  // Try Pexels first
  let result = await searchPexelsVideo(keyword, portrait)

  // Fallback to Pixabay
  if (!result) {
    result = await searchPixabayVideo(keyword)
  }

  return result
}