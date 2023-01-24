import { capitalize, dashCase, unionType } from '@pandacss/shared'
import type { PatternConfig } from '@pandacss/types'
import { outdent } from 'outdent'
import { stringify } from 'javascript-stringify'
import { match } from 'ts-pattern'
import type { PandaContext } from '../context'

function generate(ctx: PandaContext, name: string, pattern: PatternConfig) {
  const { properties, transform, strict, description } = pattern
  const { upperName, styleFn, blocklistType } = ctx.getPatternDetails(name, pattern)

  return {
    name: dashCase(name),
    dts: outdent`
    import type { SystemStyleObject, ConditionalValue } from '../types'
    import type { PropertyValue } from '../types/prop-type'
    import type { Properties } from '../types/csstype'
    import type { Tokens } from '../types/token'

    export type ${capitalize(name)}Properties = {
       ${Object.keys(properties ?? {})
         .map((key) => {
           const value = properties![key]
           return match(value)
             .with({ type: 'property' }, (value) => {
               return `${key}?: PropertyValue<'${value.value}'>`
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
                
        type ${upperName}Options = ${upperName}Properties & Omit<SystemStyleObject, keyof ${upperName}Properties ${blocklistType}>

        ${description ? `/** ${description} */` : ''}
        export declare function ${name}(options: ${upperName}Options): string
        `
    }

   `,
    js: outdent`
  ${ctx.getImport('mapObject', '../helpers')}
  ${ctx.getImport('css', '../css/index')}

  const config = ${stringify({ transform })}

  export const ${styleFn} = (styles) => config.transform(styles, { map: mapObject })

  export const ${name} = (styles) => css(${styleFn}(styles))
  `,
  }
}

export function generatePattern(ctx: PandaContext) {
  if (!ctx.hasPatterns) return
  return Object.entries(ctx.patterns).map(([name, pattern]) => generate(ctx, name, pattern))
}
