export const conditions = {
  even: { selectors: ['&:even'] },
  odd: { selectors: ['&:odd'] },

  before: { selectors: ['&::before'] },
  after: { selectors: ['&::after'] },

  selection: { selectors: ['&::selection'] },
  placeholder: { selectors: ['&::placeholder'] },
  'motion-reduce': { '@media': '(prefers-reduced-motion: reduce)' },

  hover: { selectors: ['&:hover', `&[data-hover]`] },
  focus: { selectors: ['&:focus', `&[data-focus]`] },
  disabled: { selectors: ['&:disabled', `&[data-disabled]`] },
  active: { selectors: ['&:active', `&[data-active]`] },
  'focus-visible': { selectors: ['&:focus-visible', `&[data-focus-visible]`] },

  light: { '@media': '(prefers-color-scheme: light)' },
  dark: { '@media': '(prefers-color-scheme: dark)' },
  'constrast-more': { '@media': '(prefers-contrast: more)' },
  'constrast-less': { '@media': '(prefers-contrast: less)' },

  ltr: { selector: '[dir=ltr] &' },
  rtl: { selector: '[dir=rtl] &' },

  open: { selectors: ['&[open]'] },
};
