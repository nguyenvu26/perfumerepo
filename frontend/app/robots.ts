import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/', 
        '/staff/', 
        '/dashboard/', 
        '/*/admin/', 
        '/*/staff/', 
        '/*/dashboard/'
      ],
    },
    sitemap: 'https://perfumegpt.site/sitemap.xml',
  }
}
