import { cx } from '@/styled-system/css'
import { Inter } from '@next/font/google'
import type { PropsWithChildren } from 'react'
import '../styles/globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

const RootLayout = (props: PropsWithChildren) => (
  <html lang="en" className={cx(inter.variable)}>
    <head>
      <meta charSet="utf-8" />
      <meta content="width=device-width, initial-scale=1" name="viewport" />
    </head>
    <body>{props.children}</body>
  </html>
)

export default RootLayout
