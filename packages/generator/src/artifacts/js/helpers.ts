import { outdent } from 'outdent'
import helpersMjs from '../generated/helpers.mjs.json' assert { type: 'json' }
import astishMjs from '../generated/astish.mjs.json' assert { type: 'json' }
import normalizeHtmlMjs from '../generated/normalize-html.mjs.json' assert { type: 'json' }
import type { Context } from '../../engines'

export function generateHelpers(ctx: Context) {
  return {
    js: outdent`
  ${helpersMjs.content}
  ${ctx.isTemplateLiteralSyntax ? astishMjs.content : ''}

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
