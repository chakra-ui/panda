import Script from 'next/script'
import { Providers } from '@/components/providers'
import { css, cx } from '@/styled-system/css'
import { fontClassName } from 'styles/fonts'
import seoConfig from '../seo.config'
import '../styles/panda.css'

interface Props {
  children: React.ReactNode
}

const { themeColor, ...metadata } = seoConfig
export { metadata }

export const viewport = {
  viewport: seoConfig.themeColor
}

export default function RootLayout(props: Props) {
  const { children } = props
  return (
    <html
      lang="en"
      className={cx(
        fontClassName,
        css({ fontFamily: 'body', fontSize: '0.9em' })
      )}
      suppressHydrationWarning
    >
      <head>
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
