import { ArtifactFile } from '../artifact'

export const stringLiteralCssFnDtsArtifact = new ArtifactFile({
  id: 'css/css.d.ts',
  fileName: 'css',
  type: 'dts',
  dir: (ctx) => ctx.paths.css,
  dependencies: ['syntax'],
  code() {
    return 'export declare function css(template: { raw: readonly string[] | ArrayLike<string> }): string'
  },
})

export const stringLiteralCssFnJsArtifact = new ArtifactFile({
  id: 'css/css.js',
  fileName: 'css',
  type: 'js',
  dir: (ctx) => ctx.paths.css,
  dependencies: ['syntax', 'hash', 'prefix', 'separator', 'hooks', 'plugins'],
  imports: {
    'helpers.js': ['astish', 'createCss', 'isObject', 'mergeProps', 'withoutSpace'],
    'css/conditions.js': ['finalizeConditions', 'sortConditions'],
  },
  computed(ctx) {
    return { toHash: ctx.utility.toHash }
  },
  code(params) {
    const { hash, prefix, separator } = params.dependencies

    return `
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
        toHash: ${params.computed.toHash},
        resolveShorthand(prop) {
          return prop
        },
      }
    }

    const cssFn = createCss(context)

    const fn = (style) => (isObject(style) ? style : astish(style[0]))
    export const css = (...styles) => cssFn(mergeProps(...styles.filter(Boolean).map(fn)))
    css.raw = (...styles) => mergeProps(...styles.filter(Boolean).map(fn))
    `
  },
})
