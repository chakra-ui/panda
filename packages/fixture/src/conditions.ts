import { Conditions } from '@css-panda/types'
import { breakpoints } from './breakpoints'

export const conditions: Conditions = {
  even: { type: 'pseudo-selector', value: '&:even' },
  odd: { type: 'pseudo-selector', value: '&:odd' },

  hover: { type: 'pseudo-selector', value: '&:hover' },
  focus: { type: 'pseudo-selector', value: '&:focus' },
  disabled: { type: 'pseudo-selector', value: '&:disabled' },
  active: { type: 'pseudo-selector', value: '&:active' },

  before: { type: 'pseudo-selector', value: '&::before' },
  after: { type: 'pseudo-selector', value: '&::after' },

  open: { type: 'pseudo-selector', value: '&[open]' },

  'motion-reduce': { type: 'at-rule', value: '(prefers-reduced-motion: reduce)' },

  sm: { type: 'breakpoint', value: `@media (min-width: ${breakpoints.sm})` },
  md: { type: 'breakpoint', value: `@media (min-width: ${breakpoints.md})` },
  lg: { type: 'breakpoint', value: `@media (min-width: ${breakpoints.lg})` },
  xl: { type: 'breakpoint', value: `@media (min-width: ${breakpoints.xl})` },
  '2xl': { type: 'breakpoint', value: `@media (min-width: ${breakpoints['2xl']})` },

  dark: { type: 'color-scheme', value: '[data-theme=dark]', colorScheme: 'dark' },
  light: { type: 'color-scheme', value: '[data-theme=light]', colorScheme: 'light' },
  hiConstrast: { type: 'at-rule', value: '@media (prefers-contrast: more)' },

  ltr: { type: 'parent-selector', value: '[dir=ltr] &' },
  rtl: { type: 'parent-selector', value: '[dir=rtl] &' },
}
