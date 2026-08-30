import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Providers } from '@/components/providers'
import { css, cx } from '@/styled-system/css'
import { fontClassName } from 'styles/fonts'
import seoConfig from '../seo.config'
import '../styled-system/styles.css'
import '../styles/panda.css'

interface Props {
  children: React.ReactNode
}

const { themeColor, ...rest } = seoConfig

export const metadata: Metadata = rest

export const viewport: Viewport = {
  themeColor
}

export default function RootLayout(props: Props) {
  const { children } = props
  return (
    <html
      lang="en"
      className={cx(
        fontClassName,
        css({ fontFamily: 'body' })
      )}
      suppressHydrationWarning
    >
      <head>
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Panda CSS Blog"
          href="/rss.xml"
        />
        <Script
          data-domain="panda-css.com"
          src="https://plausible.io/js/script.js"
        />
      </head>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
