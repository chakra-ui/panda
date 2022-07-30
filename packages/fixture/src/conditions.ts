export const conditions = {
  even: { selector: ':even' },
  odd: { selector: ':odd' },

  before: { selector: '::before' },
  after: { selector: '::after' },

  selection: { selector: '::selection' },
  placeholder: { selector: '::placeholder' },
  'motion-reduce': { '@media': '(prefers-reduced-motion: reduce)' },

  hover: { selector: ':hover' },
  focus: { selector: ':focus' },
  disabled: { selector: ':disabled' },
  active: { selector: ':active' },
  'focus-visible': { selector: ':focus-visible' },

  light: { '@media': '(prefers-color-scheme: light)' },
  dark: { '@media': '(prefers-color-scheme: dark)' },
  'constrast-more': { '@media': '(prefers-contrast: more)' },
  'constrast-less': { '@media': '(prefers-contrast: less)' },

  ltr: { selector: '[dir=ltr] &' },
  rtl: { selector: '[dir=rtl] &' },

  open: { selector: '[open]' },
};
