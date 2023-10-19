import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generateStringLiteralCssFn(ctx: Context) {
  const { utility, hash, prefix } = ctx

  const { separator } = utility

  return {
    dts: outdent`
    export declare function css(template: { raw: readonly string[] | ArrayLike<string> }): string
    `,
    js: outdent`
    ${ctx.file.import('astish, createCss, isObject, mergeProps, withoutSpace', '../helpers')}
    ${ctx.file.import('finalizeConditions, sortConditions', './conditions')}

    function transform(prop, value) {
      const className = \`$\{prop}${separator}$\{withoutSpace(value)}\`
      return { className }
    }

    const context = {
      hash: ${hash.className ? 'true' : 'false'},
      conditions: {
        shift: sortConditions,
        finalize: finalizeConditions,
        breakpoints: { keys: [] },
      },
      utility: {
        prefix: ${prefix.className ? JSON.stringify(prefix.className) : undefined},
        transform,
        hasShorthand: false,
        resolveShorthand(prop) {
          return prop
        },
      }
    }

    const cssFn = createCss(context)

    const fn = (style) => (isObject(style) ? style : astish(style[0]))
    export const css = (...styles) => cssFn(mergeProps(...styles.filter(Boolean).map(fn)))
    css.raw = (...styles) => mergeProps(...styles.filter(Boolean).map(fn))
    `,
  }
}
