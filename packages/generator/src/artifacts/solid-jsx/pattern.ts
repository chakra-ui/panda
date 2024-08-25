import type { Context } from '@pandacss/core'
import type { ArtifactFileId } from '@pandacss/types'
import { outdent } from 'outdent'
import { match } from 'ts-pattern'
import { ArtifactFile, type ArtifactImports } from '../artifact-map'

export function generateSolidJsxPattern(ctx: Context) {
  const { typeName, factoryName, styleProps: jsxStyleProps } = ctx.jsx

  return ctx.patterns.details.flatMap((pattern) => {
    const { baseName, upperName, styleFnName, dashName, jsxName, props, blocklistType } = pattern
    const { description, jsxElement = 'div', deprecated } = pattern.config

    return [
      new ArtifactFile({
        id: `jsx/pattern/${dashName}.js` as ArtifactFileId,
        fileName: dashName,
        type: 'js',
        dir: (ctx) => ctx.paths.jsx,
        dependencies: [`patterns.${baseName}`, 'jsxFactory', 'jsxFramework', 'jsxStyleProps'],
        imports: () => {
          const conditionals = {} as ArtifactImports
          if (jsxStyleProps === 'minimal') {
            conditionals['css/css.js'] = ['mergeCss']
          }

          return {
            ...conditionals,
            'jsx/factory.js': [factoryName],
          }
        },
        computed(ctx) {
          return { jsx: ctx.jsx }
        },
        code(params) {
          const { factoryName } = params.computed.jsx

          return `
          import { createMemo, mergeProps, splitProps } from 'solid-js'
          import { createComponent } from 'solid-js/web'
          ${ctx.file.import(styleFnName, `../patterns/${dashName}`)}

          export const ${jsxName} = /* @__PURE__ */ function ${jsxName}(props) {
            ${match(jsxStyleProps)
              .with(
                'none',
                () => outdent`
              const [patternProps, restProps] = splitProps(props, ${JSON.stringify(props)})

              const mergedProps = mergeProps(restProps, cssProps)

              return createComponent(${factoryName}.${jsxElement}, mergedProps)
              `,
              )
              .with(
                'minimal',
                () => outdent`
              const [patternProps, restProps] = splitProps(props, ${JSON.stringify(props)})

              const cssProps = createMemo(() => {
                const styleProps = ${styleFnName}(patternProps)
                return { css: mergeCss(styleProps, props.css) }
              })
              const mergedProps = mergeProps(restProps, cssProps)

              return createComponent(${factoryName}.${jsxElement}, mergedProps)
              `,
              )
              .with(
                'all',
                () => outdent`
              const [patternProps, restProps] = splitProps(props, ${JSON.stringify(props)})

              const styleProps = ${styleFnName}(patternProps)
              const mergedProps = mergeProps(styleProps, restProps)

              return createComponent(${factoryName}.${jsxElement}, mergedProps)
              `,
              )
              .exhaustive()}
          }
          `
        },
      }),
      new ArtifactFile({
        id: `jsx/pattern/${dashName}.d.ts` as ArtifactFileId,
        fileName: dashName,
        type: 'dts',
        dir: (ctx) => ctx.paths.jsx,
        dependencies: [`patterns.${baseName}`, 'jsxFactory', 'jsxFramework', 'jsxStyleProps'],
        importsType: {
          'types/system-types.d.ts': ['Assign', 'DistributiveOmit'],
          'types/jsx.d.ts': [typeName],
        },
        code() {
          return `
          import type { Component } from 'solid-js'
          ${ctx.file.importType(`${upperName}Properties`, `../patterns/${dashName}`)}

          export interface ${upperName}Props extends Assign<${typeName}<'${jsxElement}'>, DistributiveOmit<${upperName}Properties, ${
            blocklistType || '""'
          }>> {}

          ${ctx.file.jsDocComment(description, { deprecated })}
          export declare const ${jsxName}: Component<${upperName}Props>
          `
        },
      }),
    ]
  })
}
