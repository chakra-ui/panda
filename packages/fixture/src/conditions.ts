import type { Conditions } from '@pandacss/types'

export const conditions: Conditions = {
  hover: '&:hover',
  focus: '&:focus',
  focusWithin: '&:focus-within',
  focusVisible: '&:focus-visible',
  disabled: '&:disabled',
  active: '&:active',
  visited: '&:visited',
  target: '&:target',
  readOnly: '&:read-only',
  readWrite: '&:read-write',

  before: '&::before',
  after: '&::after',
  firstLetter: '&::first-letter',
  firstLine: '&::first-line',
  marker: '&::marker',
  selection: '&::selection',
  file: '&::file-selector-button',
  backdrop: '&::backdrop',

  first: '&:first-child',
  last: '&:last-child',
  only: '&:only-child',

  even: '&:even',
  odd: '&:odd',

  firstOfType: '&:first-of-type',
  lastOfType: '&:last-of-type',
  onlyOfType: '&:only-of-type',

  empty: '&:empty',

  checked: '&:checked',
  enabled: '&:enabled',

  indeterminate: '&:indeterminate',
  required: '&:required',
  valid: '&:valid',
  invalid: '&:invalid',
  autofill: '&:autofill',
  inRange: '&:in-range',
  outOfRange: '&:out-of-range',
  placeholder: '&:placeholder',
  placeholderShown: '&:placeholder-shown',

  default: '&:default',
  optional: '&:optional',

  open: '&[open]',

  motionReduce: '@media (prefers-reduced-motion: reduce)',
  print: '@media print',

  dark: '[data-theme=dark] &',
  light: '[data-theme=light] &',

  hiConstrast: '@media (forced-colors: active)',

  ltr: '[dir=ltr] &',
  rtl: '[dir=rtl] &',

  materialTheme: '[data-color=material] &',
  pastelTheme: '[data-color=pastel] &',
}
