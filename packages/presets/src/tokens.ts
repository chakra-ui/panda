import type { Tokens } from '@pandacss/types'
import { colors } from './colors'
import { animations } from './keyframes'
import { shadows } from './shadows'
import { sizes } from './sizes'
import { spacing } from './spacing'
import { fonts, fontSizes, fontWeights, letterSpacings, lineHeights } from './typography'

export const tokens: Tokens = {
  easings: {
    default: { value: 'cubic-bezier(0.4, 0, 0.2, 1)' },
    linear: { value: 'linear' },
    in: { value: 'cubic-bezier(0.4, 0, 1, 1)' },
    out: { value: 'cubic-bezier(0, 0, 0.2, 1)' },
    'in-out': { value: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  },
  durations: {
    fastest: { value: '50ms' },
    faster: { value: '100ms' },
    fast: { value: '150ms' },
    normal: { value: '200ms' },
    slow: { value: '300ms' },
    slower: { value: '400ms' },
    slowest: { value: '500ms' },
  },
  radii: {
    xs: { value: '0.125rem' },
    sm: { value: '0.25rem' },
    md: { value: '0.375rem' },
    lg: { value: '0.5rem' },
    xl: { value: '0.75rem' },
    '2xl': { value: '1rem' },
    '3xl': { value: '1.5rem' },
    full: { value: '9999px' },
  },
  fontWeights,
  lineHeights,
  fonts,
  letterSpacings,
  fontSizes,
  shadows,
  // dropShadows,
  colors,
  blurs: {
    sm: { value: '4px' },
    base: { value: '8px' },
    md: { value: '12px' },
    lg: { value: '16px' },
    xl: { value: '24px' },
    '2xl': { value: '40px' },
    '3xl': { value: '64px' },
  },
  spacing,
  sizes,
  animations,
}
