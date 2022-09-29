import type { Tokens } from '@css-panda/types'
import { colors } from './colors'
import { animations } from './keyframes'
import { dropShadows, shadows } from './shadows'
import { largeSizes, sizes } from './sizes'
import { spacing } from './spacing'
import { fonts, fontSizes, fontWeights, letterSpacings, lineHeights } from './typography'

export const tokens: Tokens = {
  easings: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  durations: {
    '75': '75ms',
    '100': '100ms',
    '150': '150ms',
  },
  radii: {
    none: '0px',
    xs: '0.125rem',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },
  fontWeights,
  lineHeights,
  fonts,
  letterSpacings,
  fontSizes,
  shadows,
  dropShadows,
  colors,
  blurs: {
    '0': '0',
    none: '0',
    sm: '4px',
    base: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '40px',
    '3xl': '64px',
  },
  spacing,
  sizes,
  largeSizes,
  animations,
}
