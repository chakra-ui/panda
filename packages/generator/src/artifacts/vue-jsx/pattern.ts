import type { Context } from '@pandacss/core'
import type { ArtifactFileId } from '@pandacss/types'
import { outdent } from 'outdent'
import { match } from 'ts-pattern'
import { ArtifactFile, type ArtifactImports } from '../artifact-map'

export function generateVueJsxPattern(ctx: Context) {
  const { typeName, factoryName, styleProps: jsxStyleProps } = ctx.jsx

  return ctx.patterns.details.flatMap((pattern) => {
    const { baseName, upperName, styleFnName, dashName, jsxName, props, blocklistType } = pattern
    const { description, jsxElement = 'div', deprecated } = pattern.config

    return [
      new ArtifactFile({
        id: `jsx/${dashName}.js` as ArtifactFileId,
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
            'helpers.js': ['splitProps'],
          }
        },
        code() {
          return `
          import { defineComponent, h, computed } from 'vue'
          ${ctx.file.import(styleFnName, `../patterns/${dashName}`)}

          export const ${jsxName} = /* @__PURE__ */ defineComponent({
              name: '${jsxName}',
              inheritAttrs: false,
              props: ${JSON.stringify(props)},
              setup(props, { attrs, slots }) {
                ${match(jsxStyleProps)
                  .with(
                    'none',
                    () => outdent`
                  const cssProps = computed(() => {
                    const styleProps = ${styleFnName}(props)
                    return { css: styleProps }
                  })

                  return () => {
                    const mergedProps = { ...attrs, ...cssProps.value }
                    return h(${factoryName}.${jsxElement}, mergedProps, slots)
                  }
                  `,
                  )
                  .with(
                    'minimal',
                    () => outdent`
                  const cssProps = computed(() => {
                    const styleProps = ${styleFnName}(props)
                    return { css: mergeCss(styleProps, attrs.css) }
                  })

                  return () => {
                    const mergedProps = { ...attrs, ...cssProps.value }
                    return h(${factoryName}.${jsxElement}, mergedProps, slots)
                  }
                  `,
                  )
                  .with(
                    'all',
                    () => outdent`
                  const styleProps = computed(() => ${styleFnName}(props))

                  return () => {
                    const mergedProps = { ...styleProps.value, ...attrs }
                    return h(${factoryName}.${jsxElement}, mergedProps, slots)
                  }
                  `,
                  )
                  .exhaustive()}
              }
          })
          `
        },
      }),
      new ArtifactFile({
        id: `jsx/${dashName}.d.ts` as ArtifactFileId,
        fileName: dashName,
        type: 'dts',
        dir: (ctx) => ctx.paths.jsx,
        dependencies: [`patterns.${baseName}`, 'jsxFactory', 'jsxFramework', 'jsxStyleProps'],
        importsType: {
          'types/system-types.d.ts': ['DistributiveOmit'],
          'types/jsx.d.ts': [typeName],
        },
        code() {
          return `
          import type { FunctionalComponent } from 'vue'
          ${ctx.file.importType(`${upperName}Properties`, `../patterns/${dashName}`)}

          export interface ${upperName}Props extends ${upperName}Properties, DistributiveOmit<${typeName}<'${jsxElement}'>, keyof ${upperName}Properties ${blocklistType}> {}

          ${ctx.file.jsDocComment(description, { deprecated })}
          export declare const ${jsxName}: FunctionalComponent<${upperName}Props>
          `
        },
      }),
    ]
  })
}
