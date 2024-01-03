import type { ArtifactFilters } from '@pandacss/types'
import { outdent } from 'outdent'
import { match } from 'ts-pattern'
import type { Context } from '../../engines'

export function generateVueJsxPattern(ctx: Context, filters?: ArtifactFilters) {
  const { typeName, factoryName, styleProps: jsxStyleProps } = ctx.jsx

  const details = ctx.patterns.filterDetails(filters)

  return details.map((pattern) => {
    const { upperName, styleFnName, dashName, jsxName, props, blocklistType } = pattern
    const { description, jsxElement = 'div' } = pattern.config

    return {
      name: dashName,
      js: outdent`
    import { defineComponent, h, computed } from 'vue'
    ${ctx.file.import('mergeCss', '../css/css')}
    ${ctx.file.import(styleFnName, `../patterns/${dashName}`)}
    ${ctx.file.import(factoryName, './factory')}

    export const ${jsxName} = /* @__PURE__ */ defineComponent({
        name: '${jsxName}',
        inheritAttrs: false,
        props: ${JSON.stringify(props)},
        setup(props, { attrs, slots }) {
          ${match(jsxStyleProps)
            .with(
              'none',
              () => outdent`
            const Comp = computed(() => {
              const styleProps = ${styleFnName}(props)
              return ${factoryName}("${jsxElement}", { base: styleProps })
            })
            
            return () => {
              return h(Comp.value, attrs, slots)
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
    `,

      dts: outdent`
    import type { FunctionalComponent } from 'vue'
    ${ctx.file.importType(`${upperName}Properties`, `../patterns/${dashName}`)}
    ${ctx.file.importType(typeName, '../types/jsx')}
    ${ctx.file.importType('DistributiveOmit', '../types/system-types')}

    export interface ${upperName}Props extends ${upperName}Properties, DistributiveOmit<${typeName}<'${jsxElement}'>, keyof ${upperName}Properties ${blocklistType}> {}

    ${description ? `/** ${description} */` : ''}
    export declare const ${jsxName}: FunctionalComponent<${upperName}Props>
    `,
    }
  })
}
