import { getSearchIndex } from '@/lib/search-index'
import { blogSource, docsSource } from '@/lib/source'

export const dynamic = 'force-static'

export function GET() {
  const index = getSearchIndex(
    docsSource.getPages().map(page => ({
      url: page.url,
      title: page.data.title,
      description: page.data.description,
      structuredData: page.data.structuredData
    })),
    blogSource.getPages().map(page => ({
      url: page.url,
      title: page.data.title,
      description: page.data.description
    }))
  )

  return Response.json(index, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'X-Robots-Tag': 'noindex'
    }
  })
}
