import type { Metadata } from 'next'
import { Noto_Sans_Devanagari } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'GN Nepal - विश्वभरका समाचार नेपालीमा',
  description: 'Global News in Nepali - Trusted, Fast, For Nepali People',
  keywords: 'GN Nepal, nepal news, nepali khabar, global news nepali, विश्व समाचार',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ne">
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6475643427467810"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className={notoSansDevanagari.className}>{children}</body>
    </html>
  )
}