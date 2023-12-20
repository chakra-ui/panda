import type { ArtifactFilters } from '@pandacss/types'
import { outdent } from 'outdent'
import { match } from 'ts-pattern'
import type { Context } from '../../engines'

export function generateQwikJsxPattern(ctx: Context, filters?: ArtifactFilters) {
  const { typeName, factoryName, styleProps: jsxStyleProps } = ctx.jsx

  const details = ctx.patterns.filterDetails(filters)

  return details.map((pattern) => {
    const { upperName, styleFnName, dashName, jsxName, props, blocklistType } = pattern
    const { description, jsxElement = 'div' } = pattern.config

    return {
      name: dashName,
      js: outdent`
      import { h } from '@builder.io/qwik'
      ${ctx.file.import('mergeCss', '../css/css')}
      ${ctx.file.import(factoryName, './factory')}
      ${ctx.file.import(styleFnName, `../patterns/${dashName}`)}

      export const ${jsxName} = function ${jsxName}(props) {
        ${match(jsxStyleProps)
          .with(
            'none',
            () => outdent`
          const { ${props.join(', ')}${props.length ? ',' : ''} ...restProps } = props
          const styleProps = ${styleFnName}({${props.join(', ')}})
          const Comp = ${factoryName}("${jsxElement}", { base: styleProps })
          return h(Comp, restProps)
          `,
          )
          .otherwise(
            () => outdent`
          const { ${props.join(', ')}${props.length ? ',' : ''} ...restProps } = props
          const styleProps = ${styleFnName}({${props.join(', ')}})

          ${match(jsxStyleProps)
            .with(
              'all',
              () => outdent`
            const mergedProps = { ...styleProps, ...restProps }
            `,
            )
            .with(
              'minimal',
              () => outdent`
            const cssProps = { css: mergeCss(styleProps, props.css) }
            const mergedProps = { ...restProps, ...cssProps }
            `,
            )
            .with(
              'none',
              () => outdent`
            const mergedProps = restProps
            `,
            )
            .exhaustive()}

          return h(${factoryName}.${jsxElement}, mergedProps)
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
}
