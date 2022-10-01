import { extractPatterns } from '@css-panda/ast'
import { capitalize, dashCase, unionType } from '@css-panda/shared'
import { outdent } from 'outdent'
import { match } from 'ts-pattern'
import type { PandaContext } from '../context'

export function generatePattern(ctx: PandaContext) {
  const patterns = ctx.config.patterns ?? []

  if (!patterns.length) return

  const extracted = extractPatterns(ctx.conf.code)

  const files = Object.values(patterns).map((pattern) => {
    return {
      name: dashCase(pattern.name),
      js: outdent`
      import { mapObject } from "../helpers"
      import { css } from "../css"

      ${extracted.get(pattern.name)}
      
      const helpers = { map: mapObject }
      
      const { transform } = ${pattern.name}Fn
      export const ${pattern.name} = (styles) => css(transform(styles, helpers))
      `,

      dts: outdent`
      import { CssObject, ConditionalValue } from "../types"
      import { Properties } from "../types/csstype"
      import { Tokens } from "../types/token"

      export type ${capitalize(pattern.name)}Options = {
         ${Object.keys(pattern.properties ?? {})
           .map((key) => {
             const value = pattern.properties![key]
             return match(value)
               .with({ type: 'property' }, (value) => {
                 return `${key}?: CssObject["${value.value}"]`
               })
               .with({ type: 'token' }, (value) => {
                 if (value.property) {
                   return `${key}?: ConditionalValue<Tokens["${value.value}"] | Properties["${value.property}"]>`
                 }
                 return `${key}?: ConditionalValue<Tokens["${value.value}"]>`
               })
               .with({ type: 'enum' }, (value) => {
                 return `${key}?: ConditionalValue<${unionType(value.value)}>`
               })
               .otherwise(() => {
                 return `${key}?: ConditionalValue<${value.type}>`
               })
           })
           .join('\n\t')}
      }

      export declare function ${pattern.name}(options: ${capitalize(pattern.name)}Options): string
     `,
    }
  })

  return files
}
