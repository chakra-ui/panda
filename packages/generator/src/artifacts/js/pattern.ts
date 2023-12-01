import { unionType } from '@pandacss/shared'
import type { ArtifactFilters } from '@pandacss/types'
import { stringify } from 'javascript-stringify'
import { outdent } from 'outdent'
import { match } from 'ts-pattern'
import type { Context } from '../../engines'

export function generatePattern(ctx: Context, filters?: ArtifactFilters) {
  if (ctx.patterns.isEmpty()) return

  const details = ctx.patterns.filterDetails(filters)

  return details.map((pattern) => {
    const { baseName, config, dashName, upperName, styleFnName, blocklistType } = pattern
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
      ${ctx.file.importType('SystemStyleObject, ConditionalValue', '../types/index')}
      ${ctx.file.importType('Properties', '../types/csstype')}
      ${ctx.file.importType('PropertyValue', '../types/prop-type')}
      ${ctx.file.importType('DistributiveOmit', '../types/system-types')}
      ${ctx.file.importType('Tokens', '../tokens/index')}

      export interface ${upperName}Properties {
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
          ? outdent`export declare function ${baseName}(styles: ${upperName}Properties): string`
          : outdent`

          interface ${upperName}Styles extends ${upperName}Properties, DistributiveOmit<SystemStyleObject, keyof ${upperName}Properties ${blocklistType}> {}

          interface ${upperName}PatternFn {
            (styles?: ${upperName}Styles): string
            raw: (styles?: ${upperName}Styles) => SystemStyleObject
          }

          ${description ? `/** ${description} */` : ''}
          export declare const ${baseName}: ${upperName}PatternFn;
          `
      }

     `,
      js: outdent`
    ${ctx.file.import(helperImports.join(', '), '../helpers')}
    ${ctx.file.import('css', '../css/index')}

    const ${baseName}Config = ${transformFn.replace(`{transform`, `{\ntransform`)}

    export const ${styleFnName} = (styles = {}) => ${baseName}Config.transform(styles, { map: mapObject })

    export const ${baseName} = (styles) => css(${styleFnName}(styles))
    ${baseName}.raw = ${styleFnName}
    `,
    }
  })
}
