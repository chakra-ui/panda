import { Navbar } from '@/components/navbar'
import { Providers } from '@/components/providers'
import { SectionFooter } from '@/components/sections/footer'
import { css, cx } from '@/styled-system/css'
import { Flex } from '@/styled-system/jsx'
import { Fira_Code } from 'next/font/google'
import localFont from 'next/font/local'
import seoConfig from '../seo.config'

import '../styles/panda.css'

type Props = {
  children: React.ReactNode
}

export const metadata = seoConfig

const MonaSans = localFont({
  src: '../styles/Mona-Sans.woff2',
  display: 'swap',
  variable: '--font-mona-sans'
})

const FiraCode = Fira_Code({
  weight: ['400', '500', '700'],
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-fira-code'
})

export default function RootLayout(props: Props) {
  const { children } = props
  return (
    <html
      lang="en"
      className={cx(
        MonaSans.variable,
        FiraCode.variable,
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
