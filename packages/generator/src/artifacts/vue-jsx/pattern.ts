import type { ArtifactFilters } from '@pandacss/types'
import { outdent } from 'outdent'
import type { Context } from '../../engines'
import { match } from 'ts-pattern'

export function generateVueJsxPattern(ctx: Context, filters?: ArtifactFilters) {
  const { typeName, factoryName, styleProps: jsxStyleProps } = ctx.jsx

  const details = ctx.patterns.filterDetails(filters)

  return details.map((pattern) => {
    const { upperName, styleFnName, dashName, jsxName, props, blocklistType } = pattern
    const { description, jsxElement = 'div' } = pattern.config
    const propList = props.map((v) => JSON.stringify(v)).join(', ')

    const cssProps = match(jsxStyleProps)
      .with('all', () => 'styleProps')
      .with('minimal', () => '{ css: mergeCss(styleProps, props.css) }')
      .with('none', () => '{}')
      .exhaustive()

    return {
      name: dashName,
      js: outdent`
    import { defineComponent, h, computed } from 'vue'
    ${ctx.file.import('mergeCss', '../css/css')}
    ${ctx.file.import(factoryName, './factory')}
    ${ctx.file.import(styleFnName, `../patterns/${dashName}`)}

    export const ${jsxName} = defineComponent({
        name: '${jsxName}',
        inheritAttrs: false,
        props: [${propList}],
        setup(props, { attrs, slots }) {
          ${match(jsxStyleProps)
            .with(
              'none',
              () => outdent`
            const Comp = ${factoryName}("${jsxElement}", { base: ${styleFnName}(props) })
            return () => {
                return h(Comp, attrs, slots)
            }
            `,
            )
            .otherwise(
              () => outdent`
              const styleProps = computed(() => ${styleFnName}(props))
              const cssProps = computed(() => (${cssProps}).value)
              return () => {
                  const computedProps = { ...cssProps.value, ...attrs }
                  return h(${factoryName}.${jsxElement}, computedProps, slots)
              }
            `,
            )}
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
