import type { Context } from '@pandacss/core'
import { allCssProperties } from '@pandacss/is-valid-prop'
import { unionType } from '@pandacss/shared'
import outdent from 'outdent'
import { match } from 'ts-pattern'

export function generateStyleProps(ctx: Context) {
  const props = new Set(allCssProperties.concat(ctx.utility.keys()).filter(Boolean))

  return outdent`
    ${ctx.file.importType('ConditionalValue', './conditions')}
    ${ctx.file.importType('PropertyValue', './prop-type')}
    ${ctx.file.importType('Token', '../tokens/index')}

    type CssVarValue = ConditionalValue<Token | (string & {}) | (number & {})>
    
    type GenericCssVarProperties = {
      [key in \`--$\{string & {}}\`]?: CssVarValue
    }

    ${match(ctx.globalVars.isEmpty())
      .with(
        false,
        () => outdent`
      type CssVarName = ${unionType(ctx.globalVars.names)}
  
      type CssVar = \`--\${CssVarName}\`
      
      export type CssVarProperties = ConfigCssVarProperties & GenericCssVarProperties
      `,
      )
      .otherwise(() => outdent`export type CssVarProperties = GenericCssVarProperties`)}

    export interface SystemProperties {
      ${Array.from(props)
        .map((v) => `\t${v}?: PropertyValue<'${v}'>`)
        .join('\n')}
    }
    `
}
