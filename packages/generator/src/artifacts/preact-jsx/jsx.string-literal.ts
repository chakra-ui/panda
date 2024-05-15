import { ArtifactFile } from '../artifact'

export const preactJsxStringLiteralFactoryJsArtifact = new ArtifactFile({
  id: 'jsx/factory.js',
  fileName: 'factory',
  type: 'js',
  dir: (ctx) => ctx.paths.jsx,
  dependencies: ['jsx', 'css/index'],
  imports: {
    'jsx/factory-helpers.js': ['getDisplayName'],
    'css/index.js': ['css', 'cx'],
  },
  computed(ctx) {
    const { factoryName, componentName } = ctx.jsx
    return { factoryName, componentName }
  },
  code(params) {
    const { componentName, factoryName } = params.computed

    return `
    import { h } from 'preact'
    import { forwardRef } from 'preact/compat'

    function createStyledFn(Dynamic) {
      const __base__ = Dynamic.__base__ || Dynamic
      return function styledFn(template) {
        const styles = css.raw(template)

        const ${componentName} = /* @__PURE__ */ forwardRef(function ${componentName}(props, ref) {
          const { as: Element = __base__, ...elementProps } = props

          function classes() {
            return cx(css(Dynamic.__styles__, styles), elementProps.className)
          }

          return h(Element, {
            ref,
            ...elementProps,
            className: classes(),
          })
        })

        const name = getDisplayName(__base__)

        ${componentName}.displayName = \`${factoryName}.\${name}\`
        ${componentName}.__styles__ = styles
        ${componentName}.__base__ = __base__

        return ${componentName}
      }
    }

    function createJsxFactory() {
      const cache = new Map()

      return new Proxy(createStyledFn, {
        apply(_, __, args) {
          return createStyledFn(...args)
        },
        get(_, el) {
          if (!cache.has(el)) {
            cache.set(el, createStyledFn(el))
          }
          return cache.get(el)
        },
      })
    }

    export const ${factoryName} = /* @__PURE__ */ createJsxFactory()
    `
  },
})
