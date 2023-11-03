import { outdent } from 'outdent'
import { match } from 'ts-pattern'
import type { Context } from '../../engines'
import type { ArtifactFilters } from '../setup-artifacts'

export function generateReactJsxPattern(ctx: Context, filters?: ArtifactFilters) {
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
      import { createElement, forwardRef } from 'react'
      ${ctx.file.import(factoryName, './factory')}
      ${ctx.file.import(styleFnName, `../patterns/${dashName}`)}

      export const ${jsxName} = /* @__PURE__ */ forwardRef(function ${jsxName}(props, ref) {
        ${match(props.length)
          .with(
            0,
            () => outdent`
        const styleProps = ${styleFnName}()
        return createElement(${factoryName}.${jsxElement}, { ref, ...styleProps, ...props })
          `,
          )
          .otherwise(
            () => outdent`
        const { ${props.join(', ')}, ...restProps } = props
        const styleProps = ${styleFnName}({${props.join(', ')}})
        return createElement(${factoryName}.${jsxElement}, { ref, ...styleProps, ...restProps })
          `,
          )}
      })
      `,

          dts: outdent`
      import type { FunctionComponent } from 'react'
      ${ctx.file.importType(`${upperName}Properties`, `../patterns/${dashName}`)}
      ${ctx.file.importType(typeName, '../types/jsx')}
      ${ctx.file.importType('DistributiveOmit', '../types/system-types')}

      export interface ${upperName}Props extends ${upperName}Properties, DistributiveOmit<${typeName}<'${jsxElement}'>, keyof ${upperName}Properties ${blocklistType}> {}

      ${description ? `/** ${description} */` : ''}
      export declare const ${jsxName}: FunctionComponent<${upperName}Props>
      `,
        }
      })
  )
}
