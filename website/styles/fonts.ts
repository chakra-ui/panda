import { cx } from '@/styled-system/css'
import { Source_Code_Pro, Onest } from 'next/font/google'

const BodyFont = Onest({
  weight: 'variable',
  style: 'normal',
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-sans'
})

export const MonoFont = Source_Code_Pro({
  weight: 'variable',
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-mono'
})

export const fontClassName = cx(MonoFont.variable, BodyFont.variable)
