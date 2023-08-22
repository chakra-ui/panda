import type { Metadata } from 'next'

const defineMetadata = <T extends Metadata>(metadata: T) => metadata

const seoConfig = defineMetadata({
  metadataBase: new URL('https://panda-css.com'),
  title: {
    template: '%s - Panda CSS',
    default:
      'Panda CSS - Build modern websites using build time and type-safe CSS-in-JS'
  },
  description: 'Build modern websites using build time and type-safe CSS-in-JS',
  themeColor: '#F6E458',
  openGraph: {
    images: '/og-image.png',
    url: 'https://panda-css.com'
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
