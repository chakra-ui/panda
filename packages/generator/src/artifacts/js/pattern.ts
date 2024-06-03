import type { Context } from '@pandacss/core'
import { compact, unionType } from '@pandacss/shared'
import type { ArtifactFileId } from '@pandacss/types'
import { stringify } from 'javascript-stringify'
import { match } from 'ts-pattern'
import { ArtifactFile } from '../artifact-map'

export function getPatternsArtifacts(ctx: Context) {
  if (ctx.patterns.isEmpty()) return []
  if (ctx.isTemplateLiteralSyntax) return []

  return ctx.patterns.details.flatMap((pattern) => {
    const { baseName, config, dashName, upperName, styleFnName, blocklistType } = pattern
    const { properties, transform, strict, description, defaultValues, deprecated } = config

    const patternConfigFn = stringify(compact({ transform, defaultValues })) ?? ''

    const helperImports = [] as string[]
    // depending on the esbuild result, sometimes the transform function couldi include polyfills (e.g. __spreadValues)
    if (patternConfigFn.includes('__spreadValues')) {
      helperImports.push('__spreadValues')
    }
    if (patternConfigFn.includes('__objRest')) {
      helperImports.push('__objRest')
    }

    return [
      new ArtifactFile({
        id: `patterns/${dashName}.d.ts` as ArtifactFileId,
        fileName: dashName,
        type: 'dts',
        dir: (ctx) => ctx.paths.pattern,
        dependencies: [`patterns.${dashName}`],
        importsType: {
          'types/index.d.ts': ['SystemStyleObject', 'ConditionalValue'],
          'types/csstype.d.ts': ['Properties'],
          'types/style-props.d.ts': ['SystemProperties'],
          'types/system-types.d.ts': ['DistributiveOmit'],
          'tokens/index.d.ts': ['Tokens'],
        },
        code() {
          return `
          export interface ${upperName}Properties {
             ${Object.keys(properties ?? {})
               .map((key) => {
                 const value = properties![key]
                 return match(value)
                   .with({ type: 'property' }, (value) => {
                     return `${key}?: SystemProperties["${value.value}"]`
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
              ? `export declare function ${baseName}(styles: ${upperName}Properties): string`
              : `
              interface ${upperName}Styles extends ${upperName}Properties, DistributiveOmit<SystemStyleObject, keyof ${upperName}Properties ${blocklistType}> {}

              interface ${upperName}PatternFn {
                (styles?: ${upperName}Styles): string
                raw: (styles?: ${upperName}Styles) => SystemStyleObject
              }

              ${ctx.file.jsDocComment(description, { deprecated })}
              export declare const ${baseName}: ${upperName}PatternFn;
              `
          }

         `
        },
      }),
      new ArtifactFile({
        id: `patterns/${dashName}.js` as ArtifactFileId,
        fileName: dashName,
        type: 'js',
        dir: (ctx) => ctx.paths.pattern,
        dependencies: [`patterns.${dashName}`],
        imports: {
          'helpers.js': ['getPatternStyles', 'patternFns'],
          'css/index.js': ['css'],
        },
        code() {
          return `
          ${helperImports.length ? ctx.file.import(helperImports.join(', '), '../helpers') : ''}

          const ${baseName}Config = ${patternConfigFn
            .replace(`{transform`, `{\ntransform`)
            .replace(`,defaultValues`, `,\ndefaultValues`)}

          export const ${styleFnName} = (styles = {}) => {
            const _styles = getPatternStyles(${baseName}Config, styles)
            return ${baseName}Config.transform(_styles, patternFns)
          }

          export const ${baseName} = (styles) => css(${styleFnName}(styles))
          ${baseName}.raw = ${styleFnName}
          `
        },
      }),
    ]
  })
}
