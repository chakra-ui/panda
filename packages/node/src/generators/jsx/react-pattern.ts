import type { PatternConfig } from '@pandacss/types'
import { outdent } from 'outdent'
import { match } from 'ts-pattern'
import type { PandaContext } from '../../context'

function generate(ctx: PandaContext, name: string, pattern: PatternConfig) {
  const { upperName, styleFn, dashName, jsxName, props, blocklistType } = ctx.getPatternDetails(name, pattern)
  const { componentName, typeName } = ctx.jsxFactoryDetails

  return {
    name: dashName,
    js: outdent`
    import { forwardRef } from 'react'
    import { ${ctx.jsxFactory} } from './factory'
    import { ${styleFn} } from '../patterns/${dashName}'

    export const ${jsxName} = forwardRef(function ${jsxName}(props, ref) {
      ${match(props.length)
        .with(
          0,
          () => outdent`
          return <${ctx.jsxFactory}.div ref={ref} {...props} />
        `,
        )
        .otherwise(
          () => outdent`
        const { ${props.join(', ')}, ...restProps } = props
        const styleProps = ${styleFn}({${props.join(', ')}})
        return <${ctx.jsxFactory}.div ref={ref} {...styleProps} {...restProps} />
        `,
        )}
        
    })    
    `,

    dts: outdent`
    import { FunctionComponent } from 'react'
    import { ${upperName}Properties } from '../patterns/${dashName}'
    import { ${componentName}, ${typeName} } from '../types/jsx'
    import { Assign } from '../types'

    export type ${upperName}Props = ${upperName}Properties & Omit<${typeName}<'div'>, keyof ${upperName}Properties ${blocklistType}>

    ${pattern.description ? `/** ${pattern.description} */` : ''}
    export declare const ${jsxName}: FunctionComponent<${upperName}Props>
    `,
  }
}

export function generateReactJsxPattern(ctx: PandaContext) {
  return Object.entries(ctx.patterns).map(([name, pattern]) => generate(ctx, name, pattern))
}
