import { outdent } from 'outdent'
import { match } from 'ts-pattern'
import type { Context } from '../../engines'

export function generateReactJsxPattern(ctx: Context) {
  const { typeName, factoryName } = ctx.jsx
  return ctx.patterns.details.map((pattern) => {
    const { upperName, styleFnName, dashName, jsxName, props, blocklistType } = pattern
    const { description } = pattern.config

    return {
      name: dashName,
      js: outdent`
      import { createElement, forwardRef } from 'react'
      ${ctx.file.import(factoryName, './factory')}
      ${ctx.file.import(styleFnName, `../patterns/${dashName}`)}
  
      export const ${jsxName} = forwardRef(function ${jsxName}(props, ref) {
        ${match(props.length)
          .with(
            0,
            () => outdent`
        return createElement(${factoryName}.div, { ref, ...props })
          `,
          )
          .otherwise(
            () => outdent`
        const { ${props.join(', ')}, ...restProps } = props
        const styleProps = ${styleFnName}({${props.join(', ')}})
        return createElement(${factoryName}.div, { ref, ...styleProps, ...restProps })
          `,
          )}
      })    
      `,

      dts: outdent`
      import type { FunctionComponent } from 'react'
      import type { ${upperName}Properties } from '../patterns/${dashName}'
      import type { ${typeName} } from '../types/jsx'
  
      export type ${upperName}Props = ${upperName}Properties & Omit<${typeName}<'div'>, keyof ${upperName}Properties ${blocklistType}>
  
      ${description ? `/** ${description} */` : ''}
      export declare const ${jsxName}: FunctionComponent<${upperName}Props>
      `,
    }
  })
}
