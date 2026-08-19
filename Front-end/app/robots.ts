import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://siyowin.lk';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/admin/', '/api/'], // Disallow crawling of private/dashboard routes
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
