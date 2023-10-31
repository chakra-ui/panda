import type { Metadata } from 'next'

const defineMetadata = <T extends Metadata>(metadata: T) => metadata

const seoConfig = defineMetadata({
  title: {
    template: '%s - Panda Playground',
    default: 'Panda Playground',
  },
  description: 'Explore Panda CSS with an interactive playground. Create and share your own Panda CSS snippets.',
  themeColor: '#F6E458',
  openGraph: {
    images: '/og-image.png',
    url: 'https://play.panda-css.com',
  },
  manifest: '/site.webmanifest',
  icons: [
    { rel: 'icon', url: '/favicon.ico' },
    { rel: 'apple-touch-icon', url: '/apple-touch-icon.png' },
    { rel: 'mask-icon', url: '/favicon.ico' },
    { rel: 'image/x-icon', url: '/favicon.ico' },
  ],
  twitter: {
    site: '@panda__css',
    creator: '@thesegunadebayo',
  },
})

export default seoConfig
