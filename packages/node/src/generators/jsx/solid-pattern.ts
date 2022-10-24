import { capitalize, dashCase } from '@css-panda/shared'
import type { PatternConfig } from '@css-panda/types'
import { outdent } from 'outdent'
import type { PandaContext } from '../../context'

function generate(name: string, pattern: PatternConfig, jsxFactory: string) {
  const upperName = capitalize(name)
  const jsxName = pattern.jsx ?? upperName

  const keys = Object.keys(pattern.properties ?? {})
  return {
    name: dashCase(name),
    js: outdent`
    import { splitProps } from 'solid-js'
    import { ${jsxFactory} } from './factory'
    import { config } from '../patterns/${dashCase(name)}'

    export function ${jsxName}(props) {
      const [patternProps, restProps] = splitProps(props, [${keys.map((v) => JSON.stringify(v)).join(', ')}]);
      const styleProps = config.transform(patternProps)
      return <${jsxFactory}.div {...styleProps} {...restProps} />
    }
    `,

    dts: outdent`
    import { ComponentProps, JSX } from 'solid-js'
    import { ${upperName}Options } from '../patterns/${dashCase(name)}'
    import { CssObject } from '../types'
    
    type ElementType = keyof JSX.IntrinsicElements
    type PropsOf<C extends ElementType> = ComponentProps<C>
    type StyleProps = CssObject & { css?: CssObject }
    type Merge<T, U> = Omit<T, keyof U> & U
    
    type Polymorphic<C extends ElementType = 'div', P = {}> = StyleProps &
      Merge<PropsOf<C>, P & { as?: C; color?: string }>

    type ${jsxName}Props<C extends ElementType> = Polymorphic<C, ${upperName}Options>
    
    export declare function ${jsxName}<V extends ElementType>(props: ${jsxName}Props<V>): JSX.Element    
    `,
  }
}

export function generateSolidJsxPattern(ctx: PandaContext) {
  if (!ctx.hasPattern) return []
  return Object.entries(ctx.patterns).map(([name, pattern]) => generate(name, pattern, ctx.jsxFactory))
}
