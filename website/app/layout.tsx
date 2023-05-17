import localFont from 'next/font/local'
import '../styles/panda.css'
import { Providers } from './providers'
import { css, cx } from '../styled-system/css'
import { Navbar } from './navbar'
import { Flex } from '../styled-system/jsx'

/** @see https://github.com/github/mona-sans */
const MonaSans = localFont({
  src: '../styles/Mona-Sans.woff2',
  display: 'swap'
})

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={cx(MonaSans.className, css({ overflow: 'hidden' }))}
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
