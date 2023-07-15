import type { Metadata } from 'next'

const defineMetadata = <T extends Metadata>(metadata: T) => metadata

const seoConfig = defineMetadata({
  title: {
    template: '%s - Panda Playground',
    default:
      'Panda Playground - Explore and experiment with Panda CSS, the build time and type-safe CSS-in-JS styling engine',
  },
  description:
    'Explore and experiment with Panda CSS, the build time and type-safe CSS-in-JS styling engine with our interactive playground. Discover the power of Panda CSS in this user-friendly visual environment for hassle-free prototyping and rapid development.',
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
