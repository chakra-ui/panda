import { getPublicUrl } from '@/lib/public-url'
import { v2Url } from '@/lib/v2-url'
import type { Metadata } from 'next'

const defineMetadata = <T extends Metadata>(metadata: T) => metadata

const publicUrl = getPublicUrl()

const seoConfig = defineMetadata({
  metadataBase: new URL(publicUrl),
  alternates: { canonical: new URL(v2Url) },
  title: {
    template: '%s - Panda CSS',
    default:
      'Panda CSS - Build modern websites using build time and type-safe CSS-in-JS'
  },
  description: 'Build modern websites using build time and type-safe CSS-in-JS',
  themeColor: '#F6E458',
  openGraph: {
    images: `${publicUrl}/og`,
    url: publicUrl
  },
  manifest: '/site.webmanifest',
  icons: [
    { rel: 'icon', url: '/favicon.ico' },
    { rel: 'apple-touch-icon', url: '/apple-touch-icon.png' },
    { rel: 'mask-icon', url: '/favicon.ico' },
    { rel: 'image/x-icon', url: '/favicon.ico' }
  ],
  twitter: {
    site: '@panda__css',
    creator: '@thesegunadebayo'
  }
})

export default seoConfig
