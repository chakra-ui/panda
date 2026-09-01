import { cx } from '@/styled-system/css'
import { Geist_Mono, Onest } from 'next/font/google'

const BodyFont = Onest({
  weight: 'variable',
  style: 'normal',
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-sans'
})

export const MonoFont = Geist_Mono({
  weight: 'variable',
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-mono'
})

export const fontClassName = cx(MonoFont.variable, BodyFont.variable)
