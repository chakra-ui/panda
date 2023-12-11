import { Navbar } from '@/components/navbar'
import { Providers } from '@/components/providers'
import { SectionFooter } from '@/components/sections/footer'
import { css, cx } from '@/styled-system/css'
import { Flex } from '@/styled-system/jsx'
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
        css({ overflowX: 'hidden', fontFamily: 'body', fontSize: '0.9em' })
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
      <body className={css({ overflowX: 'hidden', overflowY: 'auto' })}>
        <Providers>
          <Navbar />
          <Flex direction="column">{children}</Flex>
          <SectionFooter />
        </Providers>
      </body>
    </html>
  )
}
