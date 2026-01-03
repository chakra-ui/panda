import type { Context } from '@pandacss/core'
import { compact } from '@pandacss/shared'
import type { ArtifactFilters } from '@pandacss/types'
import { stringify } from 'javascript-stringify'
import { outdent } from 'outdent'

export function generatePattern(ctx: Context, filters?: ArtifactFilters) {
  if (ctx.patterns.isEmpty()) return

  const details = ctx.patterns.filterDetails(filters)

  return details.map((pattern) => {
    const { baseName, config, dashName, upperName, styleFnName, blocklistType } = pattern
    const { properties, transform, strict, description, defaultValues, deprecated } = config

    const patternConfigFn = stringify(compact({ transform, defaultValues })) ?? ''

    const helperImports = ['getPatternStyles, patternFns']
    // depending on the esbuild result, sometimes the transform function couldi include polyfills (e.g. __spreadValues)
    if (patternConfigFn.includes('__spreadValues')) {
      helperImports.push('__spreadValues')
    }
    if (patternConfigFn.includes('__objRest')) {
      helperImports.push('__objRest')
    }

    return {
      name: dashName,
      dts: outdent`
      ${ctx.file.importType('SystemStyleObject, ConditionalValue', '../types/index')}
      ${ctx.file.importType('Properties', '../types/csstype')}
      ${ctx.file.importType('SystemProperties', '../types/style-props')}
      ${ctx.file.importType('DistributiveOmit', '../types/system-types')}
      ${ctx.file.importType('Tokens', '../tokens/index')}

      export interface ${upperName}Properties {
         ${Object.keys(properties ?? {})
           .map((key) => {
             const value = properties![key]
             const typeString = ctx.patterns.getPropertyType(value)
             return `${key}?: ${typeString}`
           })
           .join('\n\t')}
      }

      ${
        strict
          ? outdent`
          interface ${upperName}Styles extends ${upperName}Properties {}

          interface ${upperName}PatternFn {
            (styles?: ${upperName}Styles): string
            raw: (styles?: ${upperName}Styles) => SystemStyleObject
          }

          ${ctx.file.jsDocComment(description, { deprecated })}
          export declare const ${baseName}: ${upperName}PatternFn;
          `
          : outdent`
          interface ${upperName}Styles extends ${upperName}Properties, DistributiveOmit<SystemStyleObject, keyof ${upperName}Properties ${blocklistType}> {}

          interface ${upperName}PatternFn {
            (styles?: ${upperName}Styles): string
            raw: (styles?: ${upperName}Styles) => SystemStyleObject
          }

          ${ctx.file.jsDocComment(description, { deprecated })}
          export declare const ${baseName}: ${upperName}PatternFn;
          `
      }

     `,
      js: outdent`
    ${ctx.file.import(helperImports.join(', '), '../helpers')}
    ${ctx.file.import('css', '../css/index')}

    const ${baseName}Config = ${patternConfigFn
      .replace(`{transform`, `{\ntransform`)
      .replace(`,defaultValues`, `,\ndefaultValues`)}

    export const ${styleFnName} = (styles = {}) => {
      const _styles = getPatternStyles(${baseName}Config, styles)
      return ${baseName}Config.transform(_styles, patternFns)
    }

    export const ${baseName} = (styles) => css(${styleFnName}(styles))
    ${baseName}.raw = ${styleFnName}
    `,
    }
  })
}
