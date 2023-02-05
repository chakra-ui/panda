import { capitalize, unionType } from '@pandacss/shared'
import { stringify } from 'javascript-stringify'
import { outdent } from 'outdent'
import { match } from 'ts-pattern'
import type { Context } from '../../engines'

export function generatePattern(ctx: Context) {
  if (!ctx.patterns.isEmpty()) return
  return ctx.patterns.details.map((pattern) => {
    const { name, config, dashName, upperName, styleFnName, blocklistType } = pattern
    const { properties, transform, strict, description } = config
    return {
      name: dashName,
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
    ${ctx.file.import('mapObject', '../helpers')}
    ${ctx.file.import('css', '../css/index')}
  
    const config = ${stringify({ transform })}
  
    export const ${styleFnName} = (styles) => config.transform(styles, { map: mapObject })
  
    export const ${name} = (styles) => css(${styleFnName}(styles))
    `,
    }
  })
}
