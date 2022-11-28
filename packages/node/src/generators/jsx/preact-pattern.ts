import { capitalize, dashCase } from '@pandacss/shared'
import type { PatternConfig } from '@pandacss/types'
import { outdent } from 'outdent'
import { match } from 'ts-pattern'
import type { PandaContext } from '../../context'

function generate(name: string, pattern: PatternConfig, jsxFactory: string) {
  const upperName = capitalize(name)
  const jsxName = pattern.jsx ?? upperName

  const keys = Object.keys(pattern.properties ?? {})
  return {
    name: dashCase(name),
    js: outdent`
    import { forwardRef } from 'preact/compat'
    import { ${jsxFactory} } from './factory'
    import { config } from '../patterns/${dashCase(name)}'

    export const ${jsxName} = forwardRef(function ${jsxName}(props, ref) {
      ${match(keys.length)
        .with(
          0,
          () => `
          return <${jsxFactory}.div ref={ref} {...props} />
        `,
        )
        .otherwise(
          () => `
        const { ${keys.join(', ')}, ...restProps } = props
        const styleProps = config.transform({${keys.join(', ')}})
        return <${jsxFactory}.div ref={ref} {...styleProps} {...restProps} />
        `,
        )}
    })    
    `,

    dts: outdent`
    import { ComponentProps, JSX, ComponentChildren } from 'preact';
    import { ${upperName}Properties } from '../patterns/${dashCase(name)}'
    import { JSXStyleProperties, Assign } from '../types'
    
    type ElementType = keyof JSX.IntrinsicElements
        
    type Polymorphic<C extends ElementType = 'div', P = {}> = JSXStyleProperties |
      Assign<Omit<ComponentProps<C>, 'color'>, P & { as?: C }>

    type ${jsxName}Props<C extends ElementType = 'div'> = Polymorphic<C, ${upperName}Properties>
    
    ${pattern.description ? `/** ${pattern.description} */` : ''}
    export declare function ${jsxName}<V extends ElementType = 'div'>(props: ${jsxName}Props<V>): JSX.Element    
    `,
  }
}

export function generatePreactJsxPattern(ctx: PandaContext) {
  if (!ctx.hasPattern) return []
  return Object.entries(ctx.patterns).map(([name, pattern]) => generate(name, pattern, ctx.jsxFactory))
}
