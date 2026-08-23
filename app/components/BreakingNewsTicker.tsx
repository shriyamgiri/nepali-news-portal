'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'

interface NewsItem {
  id: string
  text: string
  link: string
}

interface Props {
  items: NewsItem[]
  isBreaking: boolean
}

export default function BreakingNewsTicker({ items, isBreaking }: Props) {
  const marqueeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = marqueeRef.current
    if (!el || items.length === 0) return

    let pos = 0
    let animId: number
    const speed = 0.5 // pixels per frame - adjust for speed

    const animate = () => {
      pos -= speed
      // Reset when first half scrolled (we duplicate items for seamless loop)
      if (Math.abs(pos) >= el.scrollWidth / 2) {
        pos = 0
      }
      el.style.transform = `translateX(${pos}px)`
      animId = requestAnimationFrame(animate)
    }

    animId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animId)
  }, [items])

  if (!items.length) return null

  // Duplicate items for seamless loop
  const doubled = [...items, ...items]

  return (
    <div
      style={{
        background: '#111827',
        display: 'flex',
        alignItems: 'center',
        height: '44px',
        overflow: 'hidden',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Arrow Badge */}
      <div
        style={{
          background: isBreaking ? '#DC143C' : '#003893',
          color: '#fff',
          fontSize: '12px',
          fontWeight: 900,
          padding: '0 20px 0 16px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          whiteSpace: 'nowrap',
          letterSpacing: '0.06em',
          flexShrink: 0,
          clipPath: 'polygon(0 0, 88% 0, 100% 50%, 88% 100%, 0 100%)',
          fontFamily: 'Noto Sans Devanagari, sans-serif',
        }}
      >
        <span
          style={{
            width: '7px',
            height: '7px',
            background: '#fff',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'gnpulse 1s infinite',
          }}
        />
        {isBreaking ? 'ब्रेकिङ' : 'ताजा'}
      </div>

      {/* Scrolling Marquee */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          ref={marqueeRef}
          style={{
            display: 'flex',
            gap: '0',
            width: 'max-content',
            willChange: 'transform',
          }}
        >
          {doubled.map((item, i) => (
            <Link
              key={`${item.id}-${i}`}
              href={item.link}
              style={{
                color: '#d1d5db',
                fontSize: '13px',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '0',
                textDecoration: 'none',
                padding: '0 8px',
              }}
            >
              <span
                style={{
                  fontFamily: 'Noto Sans Devanagari, sans-serif',
                  fontWeight: 400,
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = '#d1d5db')}
              >
                {item.text}
              </span>
              <span
                style={{
                  color: isBreaking ? '#DC143C' : '#003893',
                  fontSize: '18px',
                  margin: '0 24px',
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                ◆
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* LIVE badge */}
      <div
        style={{
          background: 'rgba(220,20,60,0.15)',
          color: '#ff6b7a',
          fontSize: '10px',
          fontWeight: 800,
          padding: '5px 12px',
          marginRight: '12px',
          borderRadius: '4px',
          border: '1px solid rgba(220,20,60,0.3)',
          letterSpacing: '0.12em',
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
      >
        LIVE
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes gnpulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
      `}</style>
    </div>
  )
}