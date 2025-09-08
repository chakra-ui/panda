import { Providers } from '@/components/providers'
import { css, cx } from '@/styled-system/css'
import { fontClassName } from 'styles/fonts'
import seoConfig from '../seo.config'
import '../styles/global.css'
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
        <script
          defer
          data-domain="panda-css.com"
          src="https://plausible.io/js/script.js"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
