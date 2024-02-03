import type { Context } from '@pandacss/core'
import { outdent } from 'outdent'
import astishMjs from '../generated/astish.mjs.json' assert { type: 'json' }
import helpersMjs from '../generated/helpers.mjs.json' assert { type: 'json' }
import normalizeHtmlMjs from '../generated/normalize-html.mjs.json' assert { type: 'json' }

export function generateHelpers(ctx: Context) {
  return {
    js: outdent`
  ${helpersMjs.content}
  ${astishMjs.content}

  ${ctx.jsx.framework ? `${normalizeHtmlMjs.content}` : ''}

  export function __spreadValues(a, b) {
    return { ...a, ...b }
  }

  export function __objRest(source, exclude) {
    return Object.fromEntries(Object.entries(source).filter(([key]) => !exclude.includes(key)))
  }
  `,
  }
}
