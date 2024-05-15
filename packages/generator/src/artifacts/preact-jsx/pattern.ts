import type { Context } from '@pandacss/core'
import type { ArtifactFileId, ArtifactFilters } from '@pandacss/types'
import { outdent } from 'outdent'
import { match } from 'ts-pattern'
import { ArtifactFile, type ArtifactImports } from '../artifact'

export function generatePreactJsxPattern(ctx: Context, filters?: ArtifactFilters) {
  const { typeName, factoryName, styleProps: jsxStyleProps } = ctx.jsx

  const details = ctx.patterns.filterDetails(filters)

  return details.map((pattern) => {
    const { upperName, styleFnName, dashName, jsxName, props, blocklistType } = pattern
    const { description, jsxElement = 'div', deprecated } = pattern.config

    return {
      name: dashName,
      js: new ArtifactFile({
        id: `patterns/${dashName}.js` as ArtifactFileId,
        fileName: dashName,
        type: 'js',
        dir: (ctx) => ctx.paths.jsx,
        dependencies: ['patterns', 'jsxFactory', 'jsxFramework', 'jsxStyleProps'],
        imports: () => {
          const conditionals = {} as ArtifactImports
          if (jsxStyleProps === 'minimal') {
            conditionals['css/css.js'] = ['mergeCss']
          }

          return {
            ...conditionals,
            'jsx/factory.js': [factoryName],
            'helpers.js': ['splitProps'],
          }
        },
        code() {
          return `
          import { h } from 'preact'
          import { forwardRef } from 'preact/compat'

          ${ctx.file.import(styleFnName, `../patterns/${dashName}`)}

          export const ${jsxName} = /* @__PURE__ */ forwardRef(function ${jsxName}(props, ref) {
            ${match(jsxStyleProps)
              .with(
                'none',
                () => outdent`
              const [patternProps, restProps] = splitProps(props, ${JSON.stringify(props)})

              const styleProps = ${styleFnName}(patternProps)
              const Comp = ${factoryName}("${jsxElement}", { base: styleProps })

              return h(Comp, { ref, ...restProps })
              `,
              )
              .with(
                'minimal',
                () => outdent`
              const [patternProps, restProps] = splitProps(props, ${JSON.stringify(props)})

              const styleProps = ${styleFnName}(patternProps)
              const cssProps = { css: mergeCss(styleProps, props.css) }
              const mergedProps = { ref, ...restProps, ...cssProps }

              return h(${factoryName}.${jsxElement}, mergedProps)
              `,
              )
              .with(
                'all',
                () => outdent`
              const [patternProps, restProps] = splitProps(props, ${JSON.stringify(props)})

              const styleProps = ${styleFnName}(patternProps)
              const mergedProps = { ref, ...styleProps, ...restProps }

              return h(${factoryName}.${jsxElement}, mergedProps)
              `,
              )
              .exhaustive()}
          })
          `
        },
      }),

      dts: new ArtifactFile({
        id: `patterns/${dashName}.d.ts` as ArtifactFileId,
        fileName: dashName,
        type: 'dts',
        dir: (ctx) => ctx.paths.jsx,
        dependencies: ['patterns', 'jsxFactory', 'jsxFramework', 'jsxStyleProps'],
        imports: {
          'types/system-types.d.ts': ['DistributiveOmit'],
          'types/jsx.d.ts': [typeName],
        },
        code() {
          return `
          import type { FunctionComponent } from 'preact'
          ${ctx.file.importType(`${upperName}Properties`, `../patterns/${dashName}`)}

          export interface ${upperName}Props extends ${upperName}Properties, DistributiveOmit<${typeName}<'${jsxElement}'>, keyof ${upperName}Properties ${blocklistType}> {}

          ${ctx.file.jsDocComment(description, { deprecated })}
          export declare const ${jsxName}: FunctionComponent<${upperName}Props>
          `
        },
      }),
    }
  })
}
