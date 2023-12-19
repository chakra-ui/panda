import type { ArtifactFilters } from '@pandacss/types'
import { outdent } from 'outdent'
import { match } from 'ts-pattern'
import type { Context } from '../../engines'

export function generatePreactJsxPattern(ctx: Context, filters?: ArtifactFilters) {
  const { typeName, factoryName, styleProps: jsxStyleProps } = ctx.jsx

  const details = ctx.patterns.filterDetails(filters)

  return details.map((pattern) => {
    const { upperName, styleFnName, dashName, jsxName, props, blocklistType } = pattern
    const { description, jsxElement = 'div' } = pattern.config

    const cssProps = match(jsxStyleProps)
      .with('all', () => 'styleProps')
      .with('minimal', () => '{ css: mergeCss(styleProps, props.css) }')
      .with('none', () => '{}')
      .exhaustive()

    return {
      name: dashName,
      js: outdent`
      import { h } from 'preact'
      import { forwardRef } from 'preact/compat'
      ${ctx.file.import('mergeCss', '../css/css')}
      ${ctx.file.import(factoryName, './factory')}
      ${ctx.file.import(styleFnName, `../patterns/${dashName}`)}

      export const ${jsxName} = /* @__PURE__ */ forwardRef(function ${jsxName}(props, ref) {
        ${match(jsxStyleProps)
          .with(
            'none',
            () => outdent`
          const { ${props.join(', ')}${props.length ? ',' : ''} ...restProps } = props
          const styleProps = ${styleFnName}({${props.join(', ')}})
          const Comp = ${factoryName}("${jsxElement}", { base: styleProps })
          return h(Comp, { ref, ...restProps })
          `,
          )
          .otherwise(
            () => outdent`
          const { ${props.join(', ')}${props.length ? ',' : ''} ...restProps } = props
          const styleProps = ${styleFnName}({${props.join(', ')}})
          const cssProps = ${cssProps}
          const mergedProps = { ref, ...cssProps, ...restProps }

          return h(${factoryName}.${jsxElement}, mergedProps)
          `,
          )}
      })
      `,

      dts: outdent`
      import type { FunctionComponent } from 'preact'
      ${ctx.file.importType(`${upperName}Properties`, `../patterns/${dashName}`)}
      ${ctx.file.importType('DistributiveOmit', '../types/system-types')}
      ${ctx.file.importType(typeName, '../types/jsx')}

      export interface ${upperName}Props extends ${upperName}Properties, DistributiveOmit<${typeName}<'${jsxElement}'>, keyof ${upperName}Properties ${blocklistType}> {}

      ${description ? `/** ${description} */` : ''}
      export declare const ${jsxName}: FunctionComponent<${upperName}Props>
      `,
    }
  })
}
