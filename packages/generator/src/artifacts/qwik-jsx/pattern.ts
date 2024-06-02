import type { Context } from '@pandacss/core'
import type { ArtifactFileId } from '@pandacss/types'
import { outdent } from 'outdent'
import { match } from 'ts-pattern'
import { ArtifactFile, type ArtifactImports } from '../artifact'

export function generateQwikJsxPattern(ctx: Context) {
  const { typeName, factoryName, styleProps: jsxStyleProps } = ctx.jsx

  return ctx.patterns.details.flatMap((pattern) => {
    const { upperName, styleFnName, dashName, jsxName, props, blocklistType } = pattern
    const { description, jsxElement = 'div', deprecated } = pattern.config

    return [
      new ArtifactFile({
        id: `jsx/${dashName}.js` as ArtifactFileId,
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
          import { h } from '@builder.io/qwik'
          ${ctx.file.import(styleFnName, `../patterns/${dashName}`)}

          export const ${jsxName} = /* @__PURE__ */ function ${jsxName}(props) {
            ${match(jsxStyleProps)
              .with(
                'none',
                () => outdent`
              const [patternProps, restProps] = splitProps(props, ${JSON.stringify(props)})

              const styleProps = ${styleFnName}(patternProps)
              const Comp = ${factoryName}("${jsxElement}", { base: styleProps })

              return h(Comp, restProps)
              `,
              )
              .with(
                'minimal',
                () => outdent`
              const [patternProps, restProps] = splitProps(props, ${JSON.stringify(props)})

              const styleProps = ${styleFnName}(patternProps)
              const cssProps = { css: mergeCss(styleProps, props.css) }
              const mergedProps = { ...restProps, ...cssProps }

              return h(${factoryName}.${jsxElement}, mergedProps)
              `,
              )
              .with(
                'all',
                () => outdent`
              const [patternProps, restProps] = splitProps(props, ${JSON.stringify(props)})

              const styleProps = ${styleFnName}(patternProps)
              const mergedProps = { ...styleProps, ...restProps }

              return h(${factoryName}.${jsxElement}, mergedProps)
              `,
              )
              .exhaustive()}
          }
          `
        },
      }),
      new ArtifactFile({
        id: `jsx/${dashName}.d.ts` as ArtifactFileId,
        fileName: dashName,
        type: 'dts',
        dir: (ctx) => ctx.paths.jsx,
        dependencies: ['patterns', 'jsxFactory', 'jsxFramework', 'jsxStyleProps'],
        imports: {
          'types/system-types.d.ts': ['Assign', 'DistributiveOmit'],
          'types/jsx.d.ts': [typeName],
        },
        code() {
          return `
          import type { Component } from '@builder.io/qwik'
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
