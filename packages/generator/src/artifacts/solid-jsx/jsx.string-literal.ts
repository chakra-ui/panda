import { ArtifactFile } from '../artifact'

export const solidJsxStringLiteralFactoryArtifact = new ArtifactFile({
  id: 'jsx/factory.js',
  fileName: 'factory',
  type: 'js',
  dir: (ctx) => ctx.paths.jsx,
  dependencies: ['jsxFactory'],
  imports: {
    'jsx/factory-helpers.js': ['getDisplayName'],
    'css/index.js': ['css', 'cx'],
  },
  computed(ctx) {
    return { jsx: ctx.jsx }
  },
  code(params) {
    const { componentName, factoryName } = params.computed.jsx
    return `
    import { mergeProps, splitProps } from 'solid-js'
    import { Dynamic, createComponent } from 'solid-js/web'

    function createStyled(element) {
      return function styledFn(template) {
        const styles = css.raw(template)

        const ${componentName} = (props) => {
          const mergedProps = mergeProps({ as: element.__base__ || element }, props)
          const [localProps, elementProps] = splitProps(mergedProps, ['as', 'class'])

          return createComponent(
            Dynamic,
            mergeProps(
              {
                get component() {
                  return localProps.as
                },
                get class() {
                  return cx(css(element.__styles__, styles), localProps.class)
                },
              },
              elementProps,
            ),
          )
        }

        const name = getDisplayName(element)

        ${componentName}.displayName = \`${factoryName}.\${name}\`
        ${componentName}.__styles__ = styles
        ${componentName}.__base__ = element

        return ${componentName}
      }
    }

    function createJsxFactory() {
      const cache = new Map()

      return new Proxy(createStyled, {
        apply(_, __, args) {
          return createStyled(...args)
        },
        get(_, el) {
          if (!cache.has(el)) {
            cache.set(el, createStyled(el))
          }
          return cache.get(el)
        },
      })
    }

    export const ${factoryName} = /* @__PURE__ */ createJsxFactory()
        `
  },
})
