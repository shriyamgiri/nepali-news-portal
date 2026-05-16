import type { Metadata } from 'next'
import { Noto_Sans_Devanagari } from 'next/font/google'
import './globals.css'

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'नेपाल खबर - Nepal News Portal',
  description: 'विश्वभरका समाचार नेपालीमा - Global news in Nepali language',
  keywords: 'nepal news, nepali khabar, news in nepali, नेपाल समाचार',
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
