import { outdent } from 'outdent'
import type { Context } from '../../engines'
import type { ArtifactFilters } from '../setup-artifacts'

export function generateVueJsxPattern(ctx: Context, filters?: ArtifactFilters) {
  const { typeName, factoryName } = ctx.jsx

  return (
    ctx.patterns.details
      // if we have filters, filter out items that are not in the filters
      // otherwise, return all items
      .filter((pattern) => (filters?.affecteds ? filters.affecteds.patterns?.includes(pattern.dashName) : true))
      .map((pattern) => {
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
  )
}
