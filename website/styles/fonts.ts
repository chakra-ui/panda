import { cx } from '@/styled-system/css'
import { Fira_Code, Onest } from 'next/font/google'

const BodyFont = Onest({
  weight: 'variable',
  style: 'normal',
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-sans'
})

export const MonoFont = Fira_Code({
  weight: ['400', '500', '700'],
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-mono'
})

export const fontClassName = cx(MonoFont.variable, BodyFont.variable)
