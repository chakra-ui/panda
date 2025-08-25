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

  const scoped: GlobalStyleObject = {
    '*, ::before, ::after, ::backdrop, ::file-selector-button': {
      margin: '0px',
      padding: '0px',
      boxSizing: 'border-box',
      borderWidth: '0px',
      borderStyle: 'solid',
      borderColor: 'var(--global-color-border, currentcolor)',
    },
    hr: {
      height: '0px',
      color: 'inherit',
      borderTopWidth: '1px',
    },
    body: {
      height: '100%',
      lineHeight: 'inherit',
    },
    img: {
      borderStyle: 'none',
    },
    'img, svg, video, canvas, audio, iframe, embed, object': {
      display: 'block',
      verticalAlign: 'middle',
    },
    'img, video': {
      maxWidth: '100%',
      height: 'auto',
    },
    'h1, h2, h3, h4, h5, h6': {
      fontSize: 'inherit',
      fontWeight: 'inherit',
      textWrap: 'balance',
    },
    'p, h1, h2, h3, h4, h5, h6': {
      overflowWrap: 'break-word',
    },
    'ol, ul, menu': {
      listStyle: 'none',
    },
    "button, input:where([type='button'], [type='reset'], [type='submit']), ::file-selector-button": {
      appearance: 'button',
    },
    'button, input, optgroup, select, textarea, ::file-selector-button': {
      font: 'inherit',
      fontFeatureSettings: 'inherit',
      fontVariationSettings: 'inherit',
      letterSpacing: 'inherit',
      color: 'inherit',
      background: 'transparent',
    },
    '::placeholder': {
      opacity: 1,
      '--placeholder-fallback': 'rgba(0, 0, 0, 0.5)',
      color: 'var(--global-color-placeholder, var(--placeholder-fallback))',
      // Safari issues with color-mix(...) https://github.com/chakra-ui/panda/issues/3194
      '@supports (not (-webkit-appearance: -apple-pay-button)) or (contain-intrinsic-size: 1px)': {
        '--placeholder-fallback': 'color-mix(in oklab, currentcolor 50%, transparent)',
      },
    },
    '::selection': {
      backgroundColor: 'var(--global-color-selection, revert)',
    },
    textarea: {
      resize: 'vertical',
    },
    table: {
      textIndent: '0px',
      borderColor: 'inherit',
      borderCollapse: 'collapse',
    },
    summary: {
      display: 'list-item',
    },
    small: {
      fontSize: '80%',
    },
    'sub, sup': {
      fontSize: '75%',
      lineHeight: 0,
      position: 'relative',
      verticalAlign: 'baseline',
    },
    sub: {
      bottom: '-0.25em',
    },
    sup: {
      top: '-0.5em',
    },
    dialog: {
      padding: '0px',
    },
    a: {
      color: 'inherit',
      textDecoration: 'inherit',
    },
    'abbr:where([title])': {
      textDecoration: 'underline dotted',
    },
    'b, strong': {
      fontWeight: 'bolder',
    },
    'code, kbd, samp, pre': {
      '--font-mono-fallback': "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New'",
      fontFamily: 'var(--global-font-mono, var(--font-mono-fallback))',
      fontSize: '1em',
      fontFeatureSettings: 'normal',
      fontVariationSettings: 'normal',
    },
    progress: {
      verticalAlign: 'baseline',
    },
    '::-webkit-search-decoration, ::-webkit-search-cancel-button': {
      WebkitAppearance: 'none',
    },
    '::-webkit-inner-spin-button, ::-webkit-outer-spin-button': {
      height: 'auto',
    },
    ':-moz-ui-invalid': {
      boxShadow: 'none',
    },
    ':-moz-focusring': {
      outline: 'auto',
    },
    "[hidden]:where(:not([hidden='until-found']))": {
      display: 'none !important',
    },
  }

  const reset: GlobalStyleObject = {
    [scope || 'html, :host']: {
      lineHeight: '1.5',
      '--font-fallback':
        "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
      WebkitTextSizeAdjust: '100%',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
      MozTabSize: '[4]',
      tabSize: '[4]',
      fontFamily: 'var(--global-font-body, var(--font-fallback))',
      WebkitTapHighlightColor: 'transparent',
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
