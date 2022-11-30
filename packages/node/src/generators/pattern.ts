import { capitalize, dashCase, unionType } from '@pandacss/shared'
import type { PatternConfig } from '@pandacss/types'
import { outdent } from 'outdent'
import { stringify } from 'telejson'
import { match } from 'ts-pattern'
import type { PandaContext } from '../context'

function generate(name: string, pattern: PatternConfig) {
  const { properties, transform, strict, description } = pattern
  const upperName = capitalize(name)
  const upperFn = `get${upperName}Style`

  return {
    name: dashCase(name),
    dts: outdent`
    import { SystemStyleObject, ConditionalValue } from "../types"
    import { Properties } from "../types/csstype"
    import { Tokens } from "../types/token"

    export type ${capitalize(name)}Properties = {
       ${Object.keys(properties ?? {})
         .map((key) => {
           const value = properties![key]
           return match(value)
             .with({ type: 'property' }, (value) => {
               return `${key}?: SystemStyleObject["${value.value}"]`
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

    ${
      strict
        ? outdent`export declare function ${name}(options: ${upperName}Properties): string`
        : outdent`
        type Merge<T extends Record<string, any>> = SystemStyleObject | T

        ${description ? `/** ${description} */` : ''}
        export declare function ${name}(options: Merge<${upperName}Properties>): string
        `
    }

   `,
    js: outdent`
  import { mapObject } from "../helpers"
  import { css } from "../css"

  const config = ${stringify({ transform })}

  export const ${upperFn} = (styles) => config.transform(styles, { map: mapObject })

  export const ${name} = (styles) => css(${upperFn}(styles))
  `
      .replace(/"_function_([^|]*)\|(.*)"/, '$2')
      .replace(/\\"/g, '"')
      .replace('return', '; return')
      .replace(';;', ';'),
  }
}

export function generatePattern(ctx: PandaContext) {
  if (!ctx.hasPatterns) return
  return Object.entries(ctx.patterns).map(([name, pattern]) => generate(name, pattern))
}
