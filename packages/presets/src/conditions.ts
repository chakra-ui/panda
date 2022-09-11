export const conditions = {
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
  empty: '&:empty',
  checked: '&:checked',
  enabled: '&:enabled',

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

  peerFocus: '.peer:focus + &',
  peerHover: '.peer:hover + &',
  peerActive: '.peer:active + &',
  peerFocusWithin: '.peer:focus-within + &',
  peerFocusVisible: '.peer:focus-visible + &',
  peerDisabled: '.peer:disabled + &',

  groupFocus: '.group:focus + &',
  groupHover: '.group:hover + &',
  groupActive: '.group:active + &',
  groupFocusWithin: '.group:focus-within + &',
  groupFocusVisible: '.group:focus-visible + &',
  groupDisabled: '.group:disabled + &',

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
}
