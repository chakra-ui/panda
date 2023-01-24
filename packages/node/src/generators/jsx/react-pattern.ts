import type { PatternConfig } from '@pandacss/types'
import { outdent } from 'outdent'
import { match } from 'ts-pattern'
import type { PandaContext } from '../../context'

function generate(ctx: PandaContext, name: string, pattern: PatternConfig) {
  const { upperName, styleFn, dashName, jsxName, props, blocklistType } = ctx.getPatternDetails(name, pattern)
  const { typeName } = ctx.jsxFactoryDetails

  return {
    name: dashName,
    js: outdent`
    import { createElement, forwardRef } from 'react'
    ${ctx.getImport(ctx.jsxFactory, './factory')}
    ${ctx.getImport(styleFn, `../patterns/${dashName}`)}

    export const ${jsxName} = forwardRef(function ${jsxName}(props, ref) {
      ${match(props.length)
        .with(
          0,
          () => outdent`
      return createElement(${ctx.jsxFactory}.div, { ref, ...props })
        `,
        )
        .otherwise(
          () => outdent`
      const { ${props.join(', ')}, ...restProps } = props
      const styleProps = ${styleFn}({${props.join(', ')}})
      return createElement(${ctx.jsxFactory}.div, { ref, ...styleProps, ...restProps })
        `,
        )}
    })    
    `,

    dts: outdent`
    import type { FunctionComponent } from 'react'
    import type { ${upperName}Properties } from '../patterns/${dashName}'
    import type { ${typeName} } from '../types/jsx'

    export type ${upperName}Props = ${upperName}Properties & Omit<${typeName}<'div'>, keyof ${upperName}Properties ${blocklistType}>

    ${pattern.description ? `/** ${pattern.description} */` : ''}
    export declare const ${jsxName}: FunctionComponent<${upperName}Props>
    `,
  }
}

export function generateReactJsxPattern(ctx: PandaContext) {
  return Object.entries(ctx.patterns).map(([name, pattern]) => generate(ctx, name, pattern))
}
