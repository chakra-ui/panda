import type { ArtifactFilters } from '@pandacss/types'
import { outdent } from 'outdent'
import { match } from 'ts-pattern'
import type { Context } from '../../engines'

export function generateSolidJsxPattern(ctx: Context, filters?: ArtifactFilters) {
  const { typeName, factoryName } = ctx.jsx

  const details = ctx.patterns.filterDetails(filters)

  return details.map((pattern) => {
    const { upperName, styleFnName, dashName, jsxName, props, blocklistType } = pattern
    const { description, jsxElement = 'div' } = pattern.config

    return {
      name: dashName,
      js: outdent`
    import { splitProps, mergeProps } from 'solid-js'
    import { createComponent } from 'solid-js/web'
    ${ctx.file.import(factoryName, './factory')}
    ${ctx.file.import(styleFnName, `../patterns/${dashName}`)}

    export function ${jsxName}(props) {
      ${match(props.length)
        .with(
          0,
          () => outdent`
          const styleProps = ${styleFnName}()
          return createComponent(${factoryName}.${jsxElement}, mergeProps(styleProps, props))
        `,
        )
        .otherwise(
          () => outdent`
          const [patternProps, restProps] = splitProps(props, [${props.map((v) => JSON.stringify(v)).join(', ')}]);
          const styleProps = ${styleFnName}(patternProps)
          return createComponent(${factoryName}.${jsxElement}, mergeProps(styleProps, restProps))
        `,
        )}
    }
    `,

      dts: outdent`
    import type { Component } from 'solid-js'
    ${ctx.file.importType(`${upperName}Properties`, `../patterns/${dashName}`)}
    ${ctx.file.importType(typeName, '../types/jsx')}
    ${ctx.file.importType('DistributiveOmit', '../types/system-types')}

    export interface ${upperName}Props extends ${upperName}Properties, DistributiveOmit<${typeName}<'${jsxElement}'>, keyof ${upperName}Properties ${blocklistType}> {}

    ${description ? `/** ${description} */` : ''}
    export declare const ${jsxName}: Component<${upperName}Props>
    `,
    }
  })
}
