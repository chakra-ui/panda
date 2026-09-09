import { getPublicUrl } from '@/lib/public-url'
import { blogSource, docsSource } from '@/lib/source'
import type { MetadataRoute } from 'next'

/** Marketing pages, which have no content source to enumerate. */
const staticPaths = ['/', '/docs', '/blog', '/showcase', '/team', '/brand']

export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string) => getPublicUrl(path)

  return [
    ...staticPaths.map(path => ({
      url: url(path),
      changeFrequency: 'weekly' as const,
      priority: path === '/' ? 1 : 0.8
    })),
    ...docsSource.getPages().map(page => ({
      url: url(page.url),
      changeFrequency: 'weekly' as const,
      priority: 0.7
    })),
    ...blogSource.getPages().map(page => ({
      url: url(page.url),
      lastModified: new Date(page.data.date),
      changeFrequency: 'monthly' as const,
      priority: 0.6
    }))
  ]
}
