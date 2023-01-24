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
    import { splitProps, mergeProps } from 'solid-js'
    import { createComponent } from 'solid-js/web'
    ${ctx.getImport(ctx.jsxFactory, './factory')}
    ${ctx.getImport(styleFn, `../patterns/${dashName}`)}

    export function ${jsxName}(props) {
      ${match(props.length)
        .with(
          0,
          () => outdent`
          return createComponent(${ctx.jsxFactory}.div, props)
        `,
        )
        .otherwise(
          () => outdent`
          const [patternProps, restProps] = splitProps(props, [${props.map((v) => JSON.stringify(v)).join(', ')}]);
          const styleProps = ${styleFn}(patternProps)
          return createComponent(${ctx.jsxFactory}.div, mergeProps(styleProps, restProps))
        `,
        )}
    }
    `,

    dts: outdent`
    import { Component } from 'solid-js'
    import { ${upperName}Properties } from '../patterns/${dashName}'
    import { ${typeName} } from '../types/jsx'

    export type ${upperName}Props = ${upperName}Properties & Omit<${typeName}<'div'>, keyof ${upperName}Properties ${blocklistType}>

    ${pattern.description ? `/** ${pattern.description} */` : ''}
    export declare const ${jsxName}: Component<${upperName}Props>
    `,
  }
}

export function generateSolidJsxPattern(ctx: PandaContext) {
  return Object.entries(ctx.patterns).map(([name, pattern]) => generate(ctx, name, pattern))
}
