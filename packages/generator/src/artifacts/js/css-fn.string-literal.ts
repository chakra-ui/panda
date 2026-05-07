import type { Context } from '@pandacss/core'
import { outdent } from 'outdent'

export function generateStringLiteralCssFn(ctx: Context) {
  const { utility, hash, prefix } = ctx

  const { separator } = utility

  return {
    dts: outdent`
    type Styles = { raw: readonly string[] | ArrayLike<string> } | undefined | null | false

    interface CssRawFunction {
      (styles: Styles): object
      (styles: Styles[]): object
      (...styles: Array<Styles | Styles[]>): object
    }

    interface CssFunction {
      (styles: Styles): string
      (styles: Styles[]): string
      (...styles: Array<Styles | Styles[]>): string

      raw: CssRawFunction
    }

    export declare const css: CssFunction;
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
        toHash: ${utility.toHash},
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
