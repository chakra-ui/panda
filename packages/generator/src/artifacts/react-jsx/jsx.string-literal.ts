import { ArtifactFile } from '../artifact-map'

export const reactJsxStringLiteralFactoryArtifact = new ArtifactFile({
  id: 'jsx/factory.js',
  fileName: 'factory',
  type: 'js',
  dir: (ctx) => ctx.paths.jsx,
  dependencies: ['jsxFactory'],
  imports: {
    'jsx/factory-helper.js': ['getDisplayName'],
    'css/index.js': ['css', 'cx'],
  },
  computed(ctx) {
    return { jsx: ctx.jsx }
  },
  code(params) {
    const { componentName, factoryName } = params.computed.jsx
    return `
    import { createElement, forwardRef } from 'react'

    function createStyledFn(Dynamic) {
      const __base__ = Dynamic.__base__ || Dynamic
      return function styledFn(template) {
        const styles = css.raw(template)

        const ${componentName} = /* @__PURE__ */ forwardRef(function ${componentName}(props, ref) {
          const { as: Element = __base__, ...elementProps } = props

          function classes() {
            return cx(css(__base__.__styles__, styles), elementProps.className)
          }

          return createElement(Element, {
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
