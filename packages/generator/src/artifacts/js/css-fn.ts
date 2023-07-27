import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generateCssFn(ctx: Context) {
  const {
    utility,
    config: { hash, prefix },
    conditions,
  } = ctx

  const { separator } = utility
  const shorthandsByProp = Array.from(utility.shorthands.entries()).reduce((acc, [shorthand, prop]) => {
    acc[prop] = shorthand
    return acc
  }, {} as Record<string, string>)

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

    const utilities = "${utility
      .entries()
      .map(([prop, className]) => {
        const shorthand = shorthandsByProp[prop]
        // mark shorthand equal to className as 1 to save a few bytes
        return [prop, shorthand ? [className, shorthand === className ? 1 : shorthand].join('/') : className].join(':')
      })
      .join(',')}"

    const classMap = {}
    ${
      utility.hasShorthand
        ? outdent`
    const shorthands = {}
    utilities.split(',').forEach((utility) => {
      const [prop, meta] = utility.split(':')
      const [className, shorthand] = meta.split('/')
      classMap[prop] = className
      if (shorthand) shorthands[shorthand === '1' ? className : shorthand] = prop
    })

    const resolveShorthand = (prop) => shorthands[prop] || prop
    `
        : outdent`
    utilities.split(',').forEach((utility) => {
      const [prop, className] = utility.split(':')
      classMap[prop] = className
    })
    `
    }

    const context = {
      ${hash ? 'hash: true,' : ''}
      conditions: {
        shift: sortConditions,
        finalize: finalizeConditions,
        breakpoints: { keys: ${JSON.stringify(conditions.breakpoints.keys)} }
      },
      utility: {
        ${prefix ? 'prefix: ' + JSON.stringify(prefix) + ',' : ''}
        transform: ${
          utility.hasShorthand
            ? `(prop, value) => {
              const key = resolveShorthand(prop)
              const propKey = classMap[key] || hypenateProperty(key)
              return { className: \`$\{propKey}${separator}$\{withoutSpace(value)}\` }
            }`
            : `(key, value) => ({ className: \`$\{classMap[key] || hypenateProperty(key)}${separator}$\{withoutSpace(value)}\` })`
        },
        ${utility.hasShorthand ? 'hasShorthand: true,' : ''}
        resolveShorthand: ${utility.hasShorthand ? 'resolveShorthand' : 'prop => prop'},
      }
    }

    export const css = createCss(context)
    css.raw = (styles) => styles

    export const { mergeCss, assignCss } = createMergeCss(context)
    `,
  }
}
