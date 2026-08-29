import { MetadataRoute } from 'next'

const SITE_URL = 'https://nepali-news-portal-wheat.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow:     '/',
        disallow:  ['/admin/', '/api/'],
      },
      {
        userAgent: 'Googlebot',
        allow:     '/',
        disallow:  ['/admin/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host:    SITE_URL,
  }
}