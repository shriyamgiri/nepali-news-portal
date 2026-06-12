import type { Metadata } from 'next'
import { Noto_Sans_Devanagari } from 'next/font/google'
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
      <body className={notoSansDevanagari.className}>{children}</body>
    </html>
  )
}