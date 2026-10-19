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
  a: { color: 'inherit', textDecoration: 'none' },
})
