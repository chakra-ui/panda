import { generateOgImageUrl } from '@/lib/og-image'
import { getPublicUrl } from '@/lib/public-url'
import type { Metadata } from 'next'

const SITE_NAME = 'Panda CSS'
const TWITTER_SITE = '@panda__css'
const TWITTER_CREATOR = '@thesegunadebayo'

interface PageSeo {
  title: string
  description?: string
  /** Site-relative, e.g. `/docs/styling/overview`. */
  path: string
  /** Shown on the generated OG image. */
  category?: string
  publishedTime?: string
}

/**
 * Next merges metadata shallowly, so a page that declares its own `openGraph`
 * replaces the root one outright and silently loses `url` and `siteName`. This
 * builds the whole block, and the canonical alongside it.
 */
export function pageSeo(options: PageSeo): Metadata {
  const { title, description, path, category, publishedTime } = options
  const url = getPublicUrl(path)
  const images = [generateOgImageUrl({ title, description, category })]

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      images,
      ...(publishedTime
        ? { type: 'article' as const, publishedTime }
        : { type: 'website' as const })
    },
    twitter: {
      card: 'summary_large_image',
      site: TWITTER_SITE,
      creator: TWITTER_CREATOR,
      title,
      description,
      images
    }
  }
}
