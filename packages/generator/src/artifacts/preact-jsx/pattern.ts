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

    const restProps = match(props.length)
      .with(0, () => 'const restProps = props')
      .otherwise(() => `const { ${props.join(', ')}, ...restProps } = props`)

    const styleProps = match(props.length)
      .with(0, () => `${styleFnName}()`)
      .otherwise(() => `${styleFnName}({${props.join(', ')}})`)

    const cssProps = match(jsxStyleProps)
      .with('all', () => 'styleProps')
      .with('minimal', () => '{ css: styleProps }')
      .with('none', () => '{}')
      .exhaustive()

    return {
      name: dashName,
      js: outdent`
      import { h } from 'preact'
      import { forwardRef } from 'preact/compat'
      ${ctx.file.import(factoryName, './factory')}
      ${ctx.file.import(styleFnName, `../patterns/${dashName}`)}

      export const ${jsxName} = /* @__PURE__ */ forwardRef(function ${jsxName}(props, ref) {
        ${match(jsxStyleProps)
          .with(
            'none',
            () => outdent`
          ${restProps}
          const styleProps = ${styleProps}
          const Comp = ${factoryName}("${jsxElement}", { base: styleProps })
          return h(Comp, { ref, ...restProps })
          `,
          )
          .otherwise(
            () => outdent`
          ${restProps}
          const styleProps = ${styleProps}
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
