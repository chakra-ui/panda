import { Fira_Code } from 'next/font/google'
import localFont from 'next/font/local'
import { cx } from '../styled-system/css'

export const MonaSans = localFont({
  src: '../styles/Mona-Sans.woff2',
  display: 'swap',
  variable: '--font-mona-sans'
})

export const FiraCode = Fira_Code({
  weight: ['400', '500', '700'],
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-fira-code'
})

export const fontClassName = cx(MonaSans.variable, FiraCode.variable)
