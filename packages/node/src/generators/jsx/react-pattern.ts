import { capitalize, dashCase } from '@pandacss/shared'
import type { PatternConfig } from '@pandacss/types'
import { outdent } from 'outdent'
import { match } from 'ts-pattern'
import type { PandaContext } from '../../context'

function generate(name: string, pattern: PatternConfig, jsxFactory: string) {
  const upperName = capitalize(name)
  const upperFn = `get${upperName}Style`

  const jsxName = pattern.jsx ?? upperName

  const keys = Object.keys(pattern.properties ?? {})
  return {
    name: dashCase(name),
    js: outdent`
    import { forwardRef } from 'react'
    import { ${jsxFactory} } from './factory'
    import { ${upperFn} } from '../patterns/${dashCase(name)}'

    export const ${jsxName} = forwardRef(function ${jsxName}(props, ref) {
      ${match(keys.length)
        .with(
          0,
          () => outdent`
          return <${jsxFactory}.div ref={ref} {...props} />
        `,
        )
        .otherwise(
          () => outdent`
        const { ${keys.join(', ')}, ...restProps } = props
        const styleProps = ${upperFn}({${keys.join(', ')}})
        return <${jsxFactory}.div ref={ref} {...styleProps} {...restProps} />
        `,
        )}
        
    })    
    `,

    dts: outdent`
    import { ComponentProps, ElementType } from 'react'
    import { ${upperName}Properties } from '../patterns/${dashCase(name)}'
    import { JSXStyleProperties, Assign } from '../types'
    
    type Polymorphic<C extends ElementType = "div", P = {}> =
      | JSXStyleProperties
      | Assign<Omit<ComponentProps<C>, "color">, P & { as?: C }>

    export type ${jsxName}Props<C extends ElementType = 'div'> = Polymorphic<C, ${upperName}Properties>
    
    ${pattern.description ? `/** ${pattern.description} */` : ''}
    export declare function ${jsxName}<V extends ElementType = 'div'>(props: ${jsxName}Props<V>): JSX.Element    
    `,
  }
}

export function generateReactJsxPattern(ctx: PandaContext) {
  return Object.entries(ctx.patterns).map(([name, pattern]) => generate(name, pattern, ctx.jsxFactory))
}
