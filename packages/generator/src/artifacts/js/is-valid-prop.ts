import isValidPropJson from '../generated/is-valid-prop.mjs.json' assert { type: 'json' }
import type { Context } from '../../engines'
import { outdent } from 'outdent'

export function generateIsValidProp(ctx: Context) {
  if (ctx.isTemplateLiteralSyntax) return
  let content = isValidPropJson.content
  content = content.replace(
    'var userGeneratedStr = "";',
    `var userGeneratedStr = "${Array.from(new Set(ctx.properties)).join(',')}"`,
  )

  return {
    js: content,
    dts: outdent`
    declare const isCssProperty: (value: string) => boolean;

    export { isCssProperty };
    `,
  }
}
