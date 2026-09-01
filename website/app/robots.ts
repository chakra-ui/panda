import { getPublicUrl } from '@/lib/public-url'
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Plain-text mirrors of the docs, for LLMs rather than search. They are
      // linked from every page, so without this they compete with the pages
      // they duplicate. `X-Robots-Tag: noindex` covers crawlers that fetch
      // them anyway.
      disallow: ['/llms.txt/', '/llms-full.txt', '/og']
    },
    sitemap: getPublicUrl('/sitemap.xml')
  }
}
