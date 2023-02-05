import { outdent } from 'outdent'
import { match } from 'ts-pattern'
import type { Context } from '../../engines'

export function generatePreactJsxPattern(ctx: Context) {
  const {
    config: { jsxFactory },
  } = ctx

  return ctx.patterns.details.map((pattern) => {
    const { upperName, styleFnName, dashName, jsxName, props, blocklistType } = pattern
    const { description } = pattern.config
    const { typeName } = ctx.jsx

    return {
      name: dashName,
      js: outdent`
      import { h } from 'preact'
      import { forwardRef } from 'preact/compat'
      ${ctx.file.import(jsxFactory!, './factory')}
      ${ctx.file.import(styleFnName, `../patterns/${dashName}`)}
  
      export const ${jsxName} = forwardRef(function ${jsxName}(props, ref) {
        ${match(props.length)
          .with(
            0,
            () => outdent`
            return h(${jsxFactory}.div, { ref, ...props })
          `,
          )
          .otherwise(
            () => outdent`
          const { ${props.join(', ')}, ...restProps } = props
          const styleProps = ${styleFnName}({${props.join(', ')}})
          return h(${jsxFactory}.div, { ref, ...styleProps, ...restProps })
          `,
          )}
      })    
      `,

      dts: outdent`
      import type { FunctionComponent } from 'preact'
      import type { ${upperName}Properties } from '../patterns/${dashName}'
      import type { ${typeName} } from '../types/jsx'
  
      export type ${upperName}Props = ${upperName}Properties & Omit<${typeName}<'div'>, keyof ${upperName}Properties ${blocklistType}>
  
      ${description ? `/** ${description} */` : ''}
      export declare const ${jsxName}: FunctionComponent<${upperName}Props>
      `,
    }
  })
}
