import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generateCssFn(ctx: Context) {
  const {
    utility,
    config: { hash, prefix },
    conditions,
  } = ctx

  const { separator, getPropShorthands } = utility

  return {
    dts: outdent`
    ${ctx.file.importType('SystemStyleObject', '../types/index')}

    interface CssFunction {
      (...styles: Array<SystemStyleObject | undefined | null | false>): string
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
        const shorthandList = getPropShorthands(prop)

        // encode utility as:
        // prop:className/shorthand1/shorthand2/shorthand3

        // ex without shorthand
        // { prop: 'aspectRatio', className: 'aspect', result: 'aspectRatio:aspect' }

        // ex: with 1 shorthand
        // { prop: 'flexDirection', className: 'flex', result: 'flexDirection:flex/flexDir }

        // ex: with 1 shorthand with same shorthand as className
        // { prop: 'position', className: 'pos', result: 'position:pos/1' }

        // ex: with more than 1 shorthand
        // { prop: 'marginInlineStart', className: 'ms', result: 'marginInlineStart:ms/1/marginStart' }
        const result = [
          prop,
          [
            className,
            shorthandList.length
              ? // mark shorthand equal to className as 1 to save a few bytes
                shorthandList.map((shorthand) => (shorthand === className ? 1 : shorthand)).join('/')
              : null,
          ]
            .filter(Boolean)
            .join('/'),
        ].join(':')

        return result
      })
      .join(',')}"

    const classNameByProp = new Map()
    ${
      utility.hasShorthand
        ? outdent`
    const shorthands = new Map()
    utilities.split(',').forEach((utility) => {
      const [prop, meta] = utility.split(':')
      const [className, ...shorthandList] = meta.split('/')
      classNameByProp.set(prop, className)
      if (shorthandList.length) {
        shorthandList.forEach((shorthand) => {
          shorthands.set(shorthand === '1' ? className : shorthand, prop)
        })
      }
    })

    const resolveShorthand = (prop) => shorthands.get(prop) || prop
    `
        : outdent`
    utilities.split(',').forEach((utility) => {
      const [prop, className] = utility.split(':')
      classNameByProp.set(prop, className)
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
              const propKey = classNameByProp.get(key) || hypenateProperty(key)
              return { className: \`$\{propKey}${separator}$\{withoutSpace(value)}\` }
            }`
            : `(key, value) => ({ className: \`$\{classNameByProp.get(key) || hypenateProperty(key)}${separator}$\{withoutSpace(value)}\` })`
        },
        ${utility.hasShorthand ? 'hasShorthand: true,' : ''}
        resolveShorthand: ${utility.hasShorthand ? 'resolveShorthand' : 'prop => prop'},
      }
    }

    const cssFn = createCss(context)
    export const css = (...styles) => cssFn(mergeCss(...styles))
    css.raw = (styles) => styles

    export const { mergeCss, assignCss } = createMergeCss(context)
    `,
  }
}
