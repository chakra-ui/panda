import { outdent } from 'outdent'
import { match } from 'ts-pattern'
import type { Context } from '../../engines'
import type { ArtifactFilters } from '../setup-artifacts'

export function generateQwikJsxPattern(ctx: Context, filters?: ArtifactFilters) {
  const { typeName, factoryName } = ctx.jsx

  return (
    ctx.patterns.details
      // if we have filters, filter out items that are not in the filters
      // otherwise, return all items
      .filter((pattern) => (filters?.affecteds ? filters.affecteds.patterns?.includes(pattern.dashName) : true))
      .map((pattern) => {
        const { upperName, styleFnName, dashName, jsxName, props, blocklistType } = pattern
        const { description, jsxElement = 'div' } = pattern.config

        return {
          name: dashName,
          js: outdent`
      import { h } from '@builder.io/qwik'
      ${ctx.file.import(factoryName, './factory')}
      ${ctx.file.import(styleFnName, `../patterns/${dashName}`)}

      export const ${jsxName} = function ${jsxName}(props) {
        ${match(props.length)
          .with(
            0,
            () => outdent`
        const styleProps = ${styleFnName}()
        return h(${factoryName}.${jsxElement}, { ...styleProps, ...props })
          `,
          )
          .otherwise(
            () => outdent`
        const { ${props.join(', ')}, ...restProps } = props
        const styleProps = ${styleFnName}({${props.join(', ')}})
        return h(${factoryName}.${jsxElement}, { ...styleProps, ...restProps })
          `,
          )}
      }
      `,

          dts: outdent`
      import type { Component } from '@builder.io/qwik'
      ${ctx.file.importType(`${upperName}Properties`, `../patterns/${dashName}`)}
      ${ctx.file.importType(typeName, '../types/jsx')}
      ${ctx.file.importType('Assign, DistributiveOmit', '../types/system-types')}

      export interface ${upperName}Props extends Assign<${typeName}<'${jsxElement}'>, DistributiveOmit<${upperName}Properties, ${
            blocklistType || '""'
          }>> {}

      ${description ? `/** ${description} */` : ''}
      export declare const ${jsxName}: Component<${upperName}Props>
      `,
        }
      })
  )
}
