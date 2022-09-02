import type { Conditions } from '@css-panda/types'

export const conditions: Conditions = {
  even: '&:even',
  odd: '&:odd',

  hover: '&:hover',
  focus: '&:focus',
  disabled: '&:disabled',
  active: '&:active',

  before: '&::before',
  after: '&::after',

  open: '&[open]',

  motionReduce: '@media (prefers-reduced-motion: reduce)',

  dark: '[data-theme=dark] &',
  light: '[data-theme=light] &',
  hiConstrast: '@media (forced-colors: active)',

  ltr: '[dir=ltr] &',
  rtl: '[dir=rtl] &',
}
