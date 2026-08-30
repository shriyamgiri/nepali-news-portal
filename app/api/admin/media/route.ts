export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getStockImage, getStockVideo, extractSearchKeyword } from '@/app/lib/stockMedia'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const title    = searchParams.get('title')    || 'Nepal flood disaster'
    const category = searchParams.get('category') || 'world'
    const type     = searchParams.get('type')     || 'photo'

    const keyword = extractSearchKeyword(title, category)

    if (type === 'video') {
      const video = await getStockVideo(category, true)
      return NextResponse.json({
        success: true,
        keyword,
        result: video,
      })
    }

    const photo = await getStockImage(title, category)
    return NextResponse.json({
      success: true,
      keyword,
      result: photo,
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}