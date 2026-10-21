import { defineGlobalStyles } from '@pandacss/dev'

export const globalCss = defineGlobalStyles({
  'html, body': {
    bg: 'sunken',
    color: 'ink',
    fontFamily: 'body',
    fontSize: '14px',
    margin: '0',
    WebkitFontSmoothing: 'antialiased',
  },
  '*, ::before, ::after': { boxSizing: 'border-box', borderColor: 'line', borderStyle: 'solid' },
  '::selection': { bg: 'accent', color: 'onAccent' },
  '*': { scrollbarWidth: 'thin', scrollbarColor: '{colors.lineStrong} transparent' },
  '@supports not (scrollbar-color: auto)': {
    '::-webkit-scrollbar': { width: '10px', height: '10px' },
    '::-webkit-scrollbar-track': { bg: 'transparent' },
    '::-webkit-scrollbar-thumb': {
      bg: 'lineStrong',
      rounded: 'full',
      border: '3px solid transparent',
      backgroundClip: 'content-box',
    },
  },
  a: { color: 'inherit', textDecoration: 'none' },
  '@media (prefers-reduced-motion: reduce)': {
    '*, ::before, ::after': { transitionDuration: '0s !important', scrollBehavior: 'auto !important' },
  },
})
