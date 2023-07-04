import isValidPropJson from '../generated/is-valid-prop.mjs.json' assert { type: 'json' }
import type { Context } from '../../engines'
import { outdent } from 'outdent'

export function generateisValidProp(ctx: Context) {
  if (ctx.isTemplateLiteralSyntax) return
  let content = isValidPropJson.content
  content = content.replace(
    'var userGenerated = []',
    `var userGenerated = [${ctx.properties.map((key) => JSON.stringify(key)).join(',')}]`,
  )
  return {
    js: content,
    ts: outdent`
    declare const allCssProperties: string[];
    declare const isCssProperty: (value: string) => boolean;

    export { allCssProperties, isCssProperty };
    `,
  }
}
