import { MetadataRoute } from 'next'
 
export default function sitemap(): MetadataRoute.Sitemap {
  // You can later expand this to dynamically fetch routes (like courses, teachers) from your database
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://siyowin.lk';

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    }
  ]
}
