import type { PatternConfig } from '@pandacss/types'
import { outdent } from 'outdent'
import { match } from 'ts-pattern'
import type { PandaContext } from '../../context'

function generate(ctx: PandaContext, name: string, pattern: PatternConfig) {
  const { upperName, styleFn, dashName, jsxName, props } = ctx.getPatternDetails(name, pattern)
  const { componentName } = ctx.jsxFactoryDetails

  return {
    name: dashName,
    js: outdent`
    import { forwardRef } from 'preact/compat'
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
    import { ${upperName}Properties } from '../patterns/${dashName}'
    import { ${componentName} } from '../types/jsx'

    ${pattern.description ? `/** ${pattern.description} */` : ''}
    export declare const ${jsxName}: ${componentName}<'div', ${upperName}Properties>
    `,
  }
}

export function generatePreactJsxPattern(ctx: PandaContext) {
  return Object.entries(ctx.patterns).map(([name, pattern]) => generate(ctx, name, pattern))
}
