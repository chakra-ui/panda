import { defineTokens } from '@pandacss/dev'
import { colors } from './colors'

export const tokens = defineTokens({
  fontSizes: {
    xs: { value: '.75rem' },
    sm: { value: '.875rem' },
    base: { value: '1rem' },
    lg: { value: '1.125rem' },
    xl: { value: '1.25rem' },
    '2xl': { value: '1.5rem' },
    '3xl': { value: '1.875rem' },
    '4xl': { value: '2.25rem' },
    '5xl': { value: '3rem' },
    '6xl': { value: '4rem' }
  },
  fonts: {
    mono: { value: 'var(--font-fira-code), Menlo, monospace' },
    body: { value: 'var(--font-mona-sans), sans-serif' },
    heading: { value: 'var(--font-mona-sans), sans-serif' }
  },
  colors
})
