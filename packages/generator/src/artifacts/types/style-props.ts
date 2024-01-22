import type { Context } from '@pandacss/core'
import { allCssProperties } from '@pandacss/is-valid-prop'
import outdent from 'outdent'

export function generateStyleProps(ctx: Context) {
  const props = new Set(allCssProperties.concat(ctx.utility.keys()).filter(Boolean))
  return outdent`
    ${ctx.file.importType('ConditionalValue', './conditions')}
    ${ctx.file.importType('PropertyValue', './prop-type')}
    ${ctx.file.importType('Token', '../tokens/index')}

    export type CssVarProperties = {
      [key in \`--\${string}\`]?: ConditionalValue<Token | (string & {}) | (number & {})>
    }

    export interface SystemProperties {
      ${Array.from(props)
        .map((v) => `\t${v}?: PropertyValue<'${v}'>`)
        .join('\n')}
    }
    `
}
