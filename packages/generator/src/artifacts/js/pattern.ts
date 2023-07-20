import { unionType } from '@pandacss/shared'
import { stringify } from 'javascript-stringify'
import { outdent } from 'outdent'
import { match } from 'ts-pattern'
import type { Context } from '../../engines'

export function generatePattern(ctx: Context) {
  if (ctx.patterns.isEmpty()) return
  return ctx.patterns.details.map((pattern) => {
    const { name, config, dashName, upperName, styleFnName, blocklistType } = pattern
    const { properties, transform, strict, description } = config

    const transformFn = stringify({ transform }) ?? ''
    const helperImports = ['mapObject']
    if (transformFn.includes('__spreadValues')) {
      helperImports.push('__spreadValues')
    }
    if (transformFn.includes('__objRest')) {
      helperImports.push('__objRest')
    }

    return {
      name: dashName,
      dts: outdent`
      import type { SystemStyleObject, ConditionalValue } from '../types'
      import type { PropertyValue } from '../types/prop-type'
      import type { Properties } from '../types/csstype'
      import type { Tokens } from '../tokens'

      export type ${upperName}Properties = {
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

          interface ${upperName}PatternFn {
            (options?: ${upperName}Options): string
            raw: (options: ${upperName}Options) => ${upperName}Options
          }

          ${description ? `/** ${description} */` : ''}
          export declare const ${name}: ${upperName}PatternFn;
          `
      }

     `,
      js: outdent`
    ${ctx.file.import(helperImports.join(', '), '../helpers')}
    ${ctx.file.import('css', '../css/index')}

    const ${name}Config = ${transformFn.replace(`{transform`, `{\ntransform`)}

    export const ${styleFnName} = (styles = {}) => ${name}Config.transform(styles, { map: mapObject })

    export const ${name} = (styles) => css(${styleFnName}(styles))
    ${name}.raw = (styles) => styles
    `,
    }
  })
}
