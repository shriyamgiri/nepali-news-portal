import React from 'react'
import type { Metadata } from 'next'
import { Noto_Sans_Devanagari } from 'next/font/google'
import './globals.css'

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
})

const SITE_URL = 'https://nepali-news-portal-wheat.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: 'GN Nepal - विश्वभरका समाचार नेपालीमा',
    template: '%s | GN Nepal',
  },

  description: 'GN Nepal - विश्वभरका समाचार नेपालीमा। Global news translated to Nepali. Fast, accurate, trusted news for Nepali readers worldwide.',

  keywords: [
    'GN Nepal', 'Nepal news', 'Nepali news', 'nepali khabar',
    'global news nepali', 'विश्व समाचार', 'नेपाल समाचार',
    'nepal khabar', 'online khabar', 'nepali samachar',
    'nepal news online', 'latest nepal news', 'breaking news nepal',
  ],

  authors: [{ name: 'GN Nepal' }],
  creator: 'GN Nepal',
  publisher: 'GN Nepal',

  // Open Graph (Facebook, WhatsApp sharing)
  openGraph: {
    type: 'website',
    locale: 'ne_NP',
    url: SITE_URL,
    siteName: 'GN Nepal',
    title: 'GN Nepal - विश्वभरका समाचार नेपालीमा',
    description: 'Global news translated to Nepali. Fast, accurate, trusted news for Nepali readers worldwide.',
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'GN Nepal - विश्वभरका समाचार नेपालीमा',
      },
    ],
  },

  // Twitter/X Card
  twitter: {
    card: 'summary_large_image',
    title: 'GN Nepal - विश्वभरका समाचार नेपालीमा',
    description: 'Global news translated to Nepali.',
    images: [`${SITE_URL}/og-image.jpg`],
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Icons
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },

  // Verification
  verification: {
    google: 'ADD_YOUR_GOOGLE_SEARCH_CONSOLE_ID_HERE',
  },

  // AdSense
  other: {
    'google-adsense-account': 'ca-pub-6475643427467810',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ne">
      <head>
        {/* AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6475643427467810"
          crossOrigin="anonymous"
        />
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'NewsMediaOrganization',
              name: 'GN Nepal',
              url: SITE_URL,
              logo: `${SITE_URL}/logo.png`,
              description: 'Global news translated to Nepali language',
              inLanguage: 'ne',
              areaServed: 'NP',
            }),
          }}
        />
      </head>
      <body className={notoSansDevanagari.className}>
        {children}
      </body>
    </html>
  )
}