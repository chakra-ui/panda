import { cx } from '@/styled-system/css'
import { Inter } from '@next/font/google'
import type { PropsWithChildren } from 'react'
import '../styles/globals.css'
import { Providers } from '@/src/components/providers'
import seoConfig from '../../seo.config'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata = seoConfig

const RootLayout = (props: PropsWithChildren) => (
  <html lang="en" className={cx(inter.variable)} suppressHydrationWarning>
    <head>
      <meta charSet="utf-8" />
      <meta content="width=device-width, initial-scale=1" name="viewport" />
    </head>
    <body>
      <Providers>{props.children}</Providers>
    </body>
  </html>
)

export default RootLayout
