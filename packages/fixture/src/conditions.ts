import { Conditions } from '@css-panda/types'

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

  motionReduce: { type: 'at-rule', value: '(prefers-reduced-motion: reduce)' },

  sm: { type: 'screen', value: 'sm', rawValue: '@media screen and (min-width: 30em)' },
  md: { type: 'screen', value: 'md', rawValue: '@media screen and (min-width: 48em)' },
  lg: { type: 'screen', value: 'lg', rawValue: '@media screen and (min-width: 62em)' },
  xl: { type: 'screen', value: 'xl', rawValue: '@media screen and (min-width: 80em)' },
  '2xl': { type: 'screen', value: '2xl', rawValue: '@media screen and (min-width: 96em)' },

  dark: { type: 'color-scheme', value: '[data-theme=dark] &', colorScheme: 'dark' },
  light: { type: 'color-scheme', value: '[data-theme=light] &', colorScheme: 'light' },
  hiConstrast: { type: 'at-rule', value: '@media (forced-colors: active)' },

  ltr: { type: 'parent-selector', value: '[dir=ltr] &' },
  rtl: { type: 'parent-selector', value: '[dir=rtl] &' },
}
