import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generateVueJsxPattern(ctx: Context) {
  const { typeName, factoryName } = ctx.jsx

  return ctx.patterns.details.map((pattern) => {
    const { upperName, styleFnName, dashName, jsxName, props, blocklistType } = pattern
    const { description, jsxElement = 'div' } = pattern.config
    const propList = props.map((v) => JSON.stringify(v)).join(', ')

    return {
      name: dashName,
      js: outdent`
    import { defineComponent, h, computed } from 'vue'
    ${ctx.file.import(factoryName, './factory')}
    ${ctx.file.import(styleFnName, `../patterns/${dashName}`)}

    export const ${jsxName} = defineComponent({
        name: '${jsxName}',
        inheritAttrs: false,
        props: [${propList}],
        setup(props, { attrs, slots }) {
            const styleProps = computed(() => ${styleFnName}(props))
            return () => {
                const computedProps = { ...styleProps.value, ...attrs }
                return h(${factoryName}.${jsxElement}, computedProps, slots)
            }
        }
    })
    `,

      dts: outdent`
    import { FunctionalComponent } from 'vue'
    import { ${upperName}Properties } from '../patterns/${dashName}'
    import { ${typeName} } from '../types/jsx'

    export type ${upperName}Props = ${upperName}Properties & Omit<${typeName}<'${jsxElement}'>, keyof ${upperName}Properties ${blocklistType}>

    ${description ? `/** ${description} */` : ''}
    export declare const ${jsxName}: FunctionalComponent<${upperName}Props>
    `,
    }
  })
}
