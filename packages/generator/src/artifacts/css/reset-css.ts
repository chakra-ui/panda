import type { Stylesheet } from '@pandacss/core'
import { type Context } from '@pandacss/core'
import { isObject, mapEntries } from '@pandacss/shared'
import type { GlobalStyleObject } from '@pandacss/types'

export function generateResetCss(ctx: Context, sheet: Stylesheet) {
  const { preflight } = ctx.config

  const { scope = '', level = 'parent' } = isObject(preflight) ? preflight : {}

  let selector = ''

  if (scope && level === 'parent') {
    selector = `${scope} `
  } else if (scope && level === 'element') {
    selector = `&${scope}`
  }

  const scoped = {
    '*': { margin: '0px', padding: '0px', font: 'inherit' },
    '*, *::before, *::after': {
      boxSizing: 'border-box',
      borderWidth: '0px',
      borderStyle: 'solid',
      borderColor: 'var(--global-color-border, currentColor)',
    },

    hr: { height: '0px', color: 'inherit', borderTopWidth: '1px' },
    body: { height: '100%' },
    img: { borderStyle: 'none' },
    'img,  svg,  video,  canvas,  audio,  iframe,  embed,  object': {
      display: 'block',
      verticalAlign: 'middle',
    },
    'img,  video': { maxWidth: '100%', height: 'auto' },
    'p,  h1,  h2,  h3,  h4,  h5,  h6': { overflowWrap: 'break-word' },
    'ol,  ul': { listStyle: 'none' },
    'code,  kbd,  pre,  samp': { fontSize: '1em' },
    "button,  [type='button'],  [type='reset'],  [type='submit']": {
      WebkitAppearance: 'button',
      backgroundColor: 'transparent',
      backgroundImage: 'none',
    },
    'button,  input,  optgroup,  select,  textarea': { color: 'inherit' },
    'button,  select': { textTransform: 'none' },
    table: {
      textIndent: '0px',
      borderColor: 'inherit',
      borderCollapse: 'collapse',
    },
    'input::placeholder,  textarea::placeholder': {
      opacity: 1,
      color: 'var(--global-color-placeholder, #9ca3af)',
    },
    textarea: { resize: 'vertical' },
    summary: { display: 'list-item' },
    small: { fontSize: '80%' },
    'sub,  sup': {
      fontSize: '75%',
      lineHeight: 0,
      position: 'relative',
      verticalAlign: 'baseline',
    },
    sub: { bottom: '-0.25em' },
    sup: { top: '-0.5em' },
    dialog: { padding: '0px' },
    a: { color: 'inherit', textDecoration: 'inherit' },
    'abbr:where([title])': { textDecoration: 'underline dotted' },
    'b,  strong': { fontWeight: 'bolder' },
    'code,  kbd,  samp,  pre': {
      fontSize: '1em',
      '--font-mono-fallback': "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New'",
      fontFamily: 'var(--global-font-mono, var(--font-mono-fallback))',
    },
    'input[type="text"],  input[type="email"],  input[type="search"],  input[type="password"]': {
      WebkitAppearance: 'none',
      MozAppearance: 'none',
    },
    "input[type='search']": {
      WebkitAppearance: 'textfield',
      outlineOffset: '-2px',
    },
    '::-webkit-search-decoration,  ::-webkit-search-cancel-button': {
      WebkitAppearance: 'none',
    },
    '::-webkit-file-upload-button': {
      WebkitAppearance: 'button',
      font: 'inherit',
    },
    'input[type="number"]::-webkit-inner-spin-button,  input[type="number"]::-webkit-outer-spin-button': {
      height: 'auto',
    },
    "input[type='number']": { MozAppearance: 'textfield' },
    ':-moz-ui-invalid': { boxShadow: 'none' },
    ':-moz-focusring': { outline: 'auto' },
    '[hidden]': { display: 'none !important' },
  }

  const reset: GlobalStyleObject = {
    [scope || 'html']: {
      lineHeight: 1.5,
      '--font-fallback':
        "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
      WebkitTextSizeAdjust: '100%',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
      MozTabSize: '[4]',
      tabSize: '[4]',
      fontFamily: 'var(--global-font-body, var(--font-fallback))',
    },
  }

  if (level === 'element') {
    const modified = mapEntries(scoped, (k, v) => [k, { [selector]: v }])
    Object.assign(reset, modified)
  } else if (selector) {
    reset[selector] = scoped
  } else {
    Object.assign(reset, scoped)
  }

  sheet.processResetCss(reset)
}
