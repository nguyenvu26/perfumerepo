import { MetadataRoute } from 'next'
import { productService } from '@/services/product.service'
import { journalService } from '@/services/journal.service'

const baseUrl = 'https://perfumegpt.site'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch products and journals
  let products: any[] = []
  let journals: any[] = []

  try {
    const productsRes = await productService.list({ take: 1000 })
    products = productsRes.items
  } catch (e) {
    console.error('Sitemap: Failed to fetch products', e)
  }

  try {
    journals = await journalService.list()
  } catch (e) {
    console.error('Sitemap: Failed to fetch journals', e)
  }

  const locales = ['vi', 'en']
  const staticPages = [
    '',
    '/collection',
    '/journal',
  ]

  const sitemapEntries: MetadataRoute.Sitemap = []

  // Static pages for all locales
  staticPages.forEach(page => {
    locales.forEach(locale => {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: page === '' ? 'daily' : 'weekly',
        priority: page === '' ? 1 : 0.8,
      })
    })
  })

  // Products for all locales
  products.forEach(product => {
    locales.forEach(locale => {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}/products/${product.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    })
  })

  // Journals for all locales
  journals.forEach(journal => {
    locales.forEach(locale => {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}/journal/${journal.id}`,
        lastModified: new Date(journal.createdAt),
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    })
  })

  return sitemapEntries
}
