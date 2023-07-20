import { outdent } from 'outdent'
import type { Context } from '../../engines'

const stringify = (v: any) => JSON.stringify(Object.fromEntries(v), null, 2)

export function generateCssFn(ctx: Context) {
  const {
    utility,
    config: { hash, prefix },
    conditions,
  } = ctx

  const { separator } = utility

  return {
    dts: outdent`
    import type { SystemStyleObject } from '../types'

    interface CssFunction {
      (styles: SystemStyleObject): string
      raw: (styles: SystemStyleObject) => SystemStyleObject
    }

    export declare const css: CssFunction;
    `,
    js: outdent`
    ${ctx.file.import('createCss, createMergeCss, hypenateProperty, withoutSpace', '../helpers')}
    ${ctx.file.import('sortConditions, finalizeConditions', './conditions')}

    const classNameMap = ${stringify(utility.entries())}

    const shorthands = ${stringify(utility.shorthands)}

    const breakpointKeys = ${JSON.stringify(conditions.breakpoints.keys)}

    const hasShorthand = ${utility.hasShorthand ? 'true' : 'false'}

    const resolveShorthand = (prop) => shorthands[prop] || prop

    function transform(prop, value) {
      const key = resolveShorthand(prop)
      const propKey = classNameMap[key] || hypenateProperty(key)
      const className = \`$\{propKey}${separator}$\{withoutSpace(value)}\`
      return { className }
    }

    const context = {
      hash: ${hash ? 'true' : 'false'},
      conditions: {
        shift: sortConditions,
        finalize: finalizeConditions,
        breakpoints: { keys: breakpointKeys }
      },
      utility: {
        prefix: ${prefix ? JSON.stringify(prefix) : undefined},
        transform,
        hasShorthand,
        resolveShorthand,
      }
    }

    export const css = createCss(context)
    css.raw = (styles) => styles

    export const { mergeCss, assignCss } = createMergeCss(context)
    `,
  }
}
