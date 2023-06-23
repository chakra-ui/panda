import isValidPropJson from '../generated/is-valid-prop.mjs.json' assert { type: 'json' }
import type { Context } from '../../engines'

export function generateisValidProp(ctx: Context) {
  if (ctx.isStringLiteralSyntax) return
  let content = isValidPropJson.content
  content = content.replace(
    'var userGenerated = []',
    `var userGenerated = [${ctx.properties.map((key) => JSON.stringify(key)).join(',')}]`,
  )
  return {
    js: content,
  }
}
