import { outdent } from 'outdent'
import { ArtifactFile } from '../artifact'

export const cssFnDtsArtifact = new ArtifactFile({
  id: 'css/css.d.ts',
  fileName: 'css',
  type: 'dts',
  dir: (ctx) => ctx.paths.css,
  dependencies: [],
  importsType: {
    'types/index.d.ts': ['SystemStyleObject'],
  },
  code() {
    return `
    type Styles = SystemStyleObject | undefined | null | false

    interface CssRawFunction {
      (styles: Styles): SystemStyleObject
      (styles: Styles[]): SystemStyleObject
      (...styles: Array<Styles | Styles[]>): SystemStyleObject
      (styles: Styles): SystemStyleObject
    }

    interface CssFunction {
      (styles: Styles): string
      (styles: Styles[]): string
      (...styles: Array<Styles | Styles[]>): string
      (styles: Styles): string

      raw: CssRawFunction
    }

    export declare const css: CssFunction;
    `
  },
})

export const cssFnJsArtifact = new ArtifactFile({
  id: 'css/css.js',
  fileName: 'css',
  type: 'js',
  dir: (ctx) => ctx.paths.css,
  dependencies: ['hash', 'prefix', 'conditions', 'separator'],
  imports: {
    'helpers.js': ['createCss', 'createMergeCss', 'hypenateProperty', 'withoutSpace'],
    'css/conditions.js': ['finalizeConditions', 'sortConditions'],
  },
  computed(ctx) {
    const { utility, conditions } = ctx
    const { getPropShorthands } = utility

    return {
      utility,
      conditions,
      getPropShorthands,
    }
  },
  code(params) {
    const { hash, prefix, separator } = params.dependencies
    const { utility, conditions, getPropShorthands } = params.computed

    return `
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
      ${hash.className ? 'hash: true,' : ''}
      conditions: {
        shift: sortConditions,
        finalize: finalizeConditions,
        breakpoints: { keys: ${JSON.stringify(conditions.breakpoints.keys)} }
      },
      utility: {
        ${prefix.className ? 'prefix: ' + JSON.stringify(prefix.className) + ',' : ''}
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
        toHash: ${utility.toHash},
        resolveShorthand: ${utility.hasShorthand ? 'resolveShorthand' : 'prop => prop'},
      }
    }

    const cssFn = createCss(context)
    export const css = (...styles) => cssFn(mergeCss(...styles))
    css.raw = (...styles) => mergeCss(...styles)

    export const { mergeCss, assignCss } = createMergeCss(context)
    `
  },
})
