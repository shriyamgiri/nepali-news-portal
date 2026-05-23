'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'

interface Ad {
  id: string
  type: string
  file_url: string | null
  html_content: string | null
  click_url: string | null
  is_adsense: boolean
  adsense_slot_id: string | null
  title: string
}

interface AdSlotProps {
  position: string
  className?: string
}

export default function AdSlot({ position, className = '' }: AdSlotProps) {
  const [ad, setAd] = useState<Ad | null>(null)

  useEffect(() => {
    loadAd()
  }, [position])

  async function loadAd() {
    const now = new Date().toISOString()
    const { data } = await supabase
      .from('ads')
      .select('*')
      .eq('position', position)
      .eq('is_active', true)
      .or(`end_date.is.null,end_date.gte.${now}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (data) {
      setAd(data)
      // Track view
      trackEvent(data.id, 'view')
    }
  }

  async function trackEvent(adId: string, type: 'view' | 'click') {
    // Increment counter
    await supabase.rpc(
      type === 'view' ? 'increment_ad_views' : 'increment_ad_clicks',
      { ad_id: adId }
    )
    // Log event
    await supabase.from('ad_events').insert({
      ad_id:      adId,
      event_type: type,
      page_url:   window.location.pathname,
    })
  }

  function handleClick() {
    if (!ad) return
    trackEvent(ad.id, 'click')
    if (ad.click_url) window.open(ad.click_url, '_blank', 'noopener')
  }

  if (!ad) return null

  return (
    <div className={`ad-slot relative ${className}`} data-position={position}>
      {/* Ad Label */}
      <span className="absolute top-1 left-1 text-[10px] text-gray-400 bg-white/80 px-1 rounded z-10">
        Ad
      </span>

      {/* AdSense */}
      {ad.is_adsense && ad.adsense_slot_id && (
        <ins
          className="adsbygoogle block"
          data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID}
          data-ad-slot={ad.adsense_slot_id}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      )}

      {/* Image Ad */}
      {!ad.is_adsense && ad.type === 'image' && ad.file_url && (
        <button onClick={handleClick} className="w-full block cursor-pointer">
          <img
            src={ad.file_url}
            alt={ad.title}
            className="w-full h-auto rounded-lg"
          />
        </button>
      )}

      {/* Video Ad */}
      {!ad.is_adsense && ad.type === 'video' && ad.file_url && (
        <button onClick={handleClick} className="w-full block cursor-pointer">
          <video
            src={ad.file_url}
            className="w-full rounded-lg"
            autoPlay muted loop playsInline
          />
        </button>
      )}

      {/* HTML Ad */}
      {!ad.is_adsense && ad.type === 'html' && ad.html_content && (
        <div
          onClick={handleClick}
          className="cursor-pointer"
          dangerouslySetInnerHTML={{ __html: ad.html_content }}
        />
      )}
    </div>
  )
}
