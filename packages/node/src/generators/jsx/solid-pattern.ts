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
    import { splitProps } from 'solid-js'
    import { ${ctx.jsxFactory} } from './factory'
    import { ${styleFn} } from '../patterns/${dashName}'

    export function ${jsxName}(props) {
      ${match(props.length)
        .with(
          0,
          () => outdent`
          return <${ctx.jsxFactory}.div {...props} />
        `,
        )
        .otherwise(
          () => outdent`
          const [patternProps, restProps] = splitProps(props, [${props.map((v) => JSON.stringify(v)).join(', ')}]);
          const styleProps = ${styleFn}(patternProps)
          return <${ctx.jsxFactory}.div {...styleProps} {...restProps} />
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
