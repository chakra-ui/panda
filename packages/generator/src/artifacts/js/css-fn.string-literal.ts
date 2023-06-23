import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generateStringLiteralCssFn(ctx: Context) {
  const {
    utility,
    config: { hash, prefix },
  } = ctx

  const { separator } = utility

  return {
    dts: outdent`
    export declare function css(template: { raw: readonly string[] | ArrayLike<string> }): string
    `,
    js: outdent`
    ${ctx.file.import('astish, createCss, withoutSpace', '../helpers')}
    ${ctx.file.import('sortConditions, finalizeConditions', './conditions')}

    function transform(prop, value) {
      const className = \`$\{prop}${separator}$\{withoutSpace(value)}\`
      return { className }
    }

    const context = {
      hash: ${hash ? 'true' : 'false'},
      conditions: {
        shift: sortConditions,
        finalize: finalizeConditions,
        breakpoints: { keys: [] },
      },
      utility: {
        prefix: ${prefix ? JSON.stringify(prefix) : undefined},
        transform,
        hasShorthand: false,
        resolveShorthand(prop) {
          return prop
        },
      }
    }

    const cssFn = createCss(context)

    export const css = (str) => {
      return cssFn(astish(str[0]))
    }
    `,
  }
}
