export const conditions = {
  hover: '&:is(:hover, [data-hover])',
  focus: '&:is(:focus, [data-focus])',
  focusWithin: '&:focus-within',
  focusVisible: '&:is(:focus-visible, [data-focus-visible])',
  disabled: '&:is(:disabled, [disabled], [data-disabled])',
  active: '&:is(:active, [data-active])',
  visited: '&:visited',
  target: '&:target',
  readOnly: '&:is(:read-only, [data-read-only])',
  readWrite: '&:read-write',
  empty: '&:is(:empty, [data-empty])',
  checked: '&:is(:checked, [data-checked], [aria-checked=true], [data-state="checked"])',
  enabled: '&:enabled',
  expanded: '&:is([aria-expanded=true], [data-expanded], [data-state="expanded"])',
  highlighted: '&[data-highlighted]',

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
  even: '&:nth-child(even)',
  odd: '&:nth-child(odd)',

  firstOfType: '&:first-of-type',
  lastOfType: '&:last-of-type',
  onlyOfType: '&:only-of-type',

  peerFocus: '.peer:is(:focus, [data-focus]) ~ &',
  peerHover: '.peer:is(:hover, [data-hover]) ~ &',
  peerActive: '.peer:is(:active, [data-active]) ~ &',
  peerFocusWithin: '.peer:focus-within ~ &',
  peerFocusVisible: '.peer:is(:focus-visible, [data-focus-visible]) ~ &',
  peerDisabled: '.peer:is(:disabled, [disabled], [data-disabled]) ~ &',
  peerChecked: '.peer:is(:checked, [data-checked], [aria-checked=true], [data-state="checked"]) ~ &',
  peerInvalid: '.peer:is(:invalid, [data-invalid], [aria-invalid=true]) ~ &',
  peerExpanded: '.peer:is([aria-expanded=true], [data-expanded], [data-state="expanded"]) ~ &',
  peerPlaceholderShown: '.peer:placeholder-shown ~ &',

  groupFocus: '.group:is(:focus, [data-focus]) &',
  groupHover: '.group:is(:hover, [data-hover]) &',
  groupActive: '.group:is(:active, [data-active]) &',
  groupFocusWithin: '.group:focus-within &',
  groupFocusVisible: '.group:is(:focus-visible, [data-focus-visible]) &',
  groupDisabled: '.group:is(:disabled, [disabled], [data-disabled]) &',
  groupChecked: '.group:is(:checked, [data-checked], [aria-checked=true], [data-state="checked"]) &',
  groupExpanded: '.group:is([aria-expanded=true], [data-expanded], [data-state="expanded"]) &',
  groupInvalid: '.group:invalid &',

  indeterminate: '&:is(:indeterminate, [data-indeterminate], [aria-checked=mixed], [data-state="indeterminate"])',
  required: '&:is(:required, [data-required], [aria-required=true])',
  valid: '&:is(:valid, [data-valid])',
  invalid: '&:is(:invalid, [data-invalid])',
  autofill: '&:autofill',
  inRange: '&:in-range',
  outOfRange: '&:out-of-range',
  placeholder: '&::placeholder',
  placeholderShown: '&:placeholder-shown',
  pressed: '&:is([aria-pressed=true], [data-pressed])',
  selected: '&:is([aria-selected=true], [data-selected])',

  default: '&:default',
  optional: '&:optional',
  open: '&:is([open], [data-open], [data-state="open"])',
  closed: '&:is([closed], [data-closed], [data-state="closed"])',
  fullscreen: '&:fullscreen',
  loading: '&:is([data-loading], [aria-busy=true])',

  currentPage: '&[aria-current=page]',
  currentStep: '&[aria-current=step]',

  motionReduce: '@media (prefers-reduced-motion: reduce)',
  motionSafe: '@media (prefers-reduced-motion: no-preference)',
  print: '@media print',
  landscape: '@media (orientation: landscape)',
  portrait: '@media (orientation: portrait)',

  dark: ' &.dark, .dark &',
  light: ' &.light, .light &',
  osDark: '@media (prefers-color-scheme: dark)',
  osLight: '@media (prefers-color-scheme: light)',

  highContrast: '@media (forced-colors: active)',
  lessContrast: '@media (prefers-contrast: less)',
  moreContrast: '@media (prefers-contrast: more)',

  ltr: '[dir=ltr] &',
  rtl: '[dir=rtl] &',

  scrollbar: '&::-webkit-scrollbar',
  scrollbarThumb: '&::-webkit-scrollbar-thumb',
  scrollbarTrack: '&::-webkit-scrollbar-track',

  horizontal: '&[data-orientation=horizontal]',
  vertical: '&[data-orientation=vertical]',
}
