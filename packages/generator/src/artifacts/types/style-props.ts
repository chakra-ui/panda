import { allCssProperties } from '@pandacss/is-valid-prop'
import outdent from 'outdent'
import type { Context } from '../../engines'

export function generateStyleProps(ctx: Context) {
  const props = new Set(allCssProperties.concat(ctx.utility.keys()))
  return outdent`
    import { PropertyValue } from './prop-type'
    import { Token } from './token-types'

    type CssVarProperties = {
      [key in \`--\${string}\`]?: Token | (string & {}) | (number & {})
    }
  
    export type SystemProperties = CssVarProperties & {
      ${Array.from(props)
        .map((v) => `\t${v}?: PropertyValue<'${v}'>`)
        .join('\n')}
    }
    `
}
