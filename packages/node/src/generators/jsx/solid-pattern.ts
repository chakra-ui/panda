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
    import { splitProps } from 'solid-js'
    import { ${jsxFactory} } from './factory'
    import { ${upperFn} } from '../patterns/${dashCase(name)}'

    export function ${jsxName}(props) {
      ${match(keys.length)
        .with(
          0,
          () => outdent`
          return <${jsxFactory}.div {...props} />
        `,
        )
        .otherwise(
          () => outdent`
          const [patternProps, restProps] = splitProps(props, [${keys.map((v) => JSON.stringify(v)).join(', ')}]);
          const styleProps = ${upperFn}(patternProps)
          return <${jsxFactory}.div {...styleProps} {...restProps} />
        `,
        )}
    }
    `,

    dts: outdent`
    import { ${upperName}Properties } from '../patterns/${dashCase(name)}'
    import { PolymorphicComponent } from '../types/jsx'

    ${pattern.description ? `/** ${pattern.description} */` : ''}
    export declare const ${jsxName}: PolymorphicComponent<"div", ${upperName}Properties>
    `,
  }
}

export function generateSolidJsxPattern(ctx: PandaContext) {
  return Object.entries(ctx.patterns).map(([name, pattern]) => generate(name, pattern, ctx.jsxFactory))
}
