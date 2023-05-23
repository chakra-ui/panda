import { Metadata } from 'next'
import { css, cx } from '../styled-system/css'
import { Flex } from '../styled-system/jsx'
import { fontClassName } from '../styles/fonts'
import '../styles/panda.css'
import { Navbar } from './navbar'
import { Providers } from './providers'

type Props = {
  children: React.ReactNode
}

export const metadata: Metadata = {
  title: {
    template: '%s | Panda CSS',
    default:
      'Panda CSS  - The fastest way to build beautiful websites in React.'
  },
  description: 'The fastest way to build beautiful websites in React.',
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
  ]
}

export default function RootLayout(props: Props) {
  const { children } = props
  return (
    <html
      lang="en"
      className={cx(
        fontClassName,
        css({ overflow: 'hidden', fontFamily: 'body' })
      )}
      suppressHydrationWarning
    >
      <body className={css({ overflowX: 'hidden', overflowY: 'auto' })}>
        <Providers>
          <Navbar />
          <Flex direction="column">{children}</Flex>
        </Providers>
      </body>
    </html>
  )
}
