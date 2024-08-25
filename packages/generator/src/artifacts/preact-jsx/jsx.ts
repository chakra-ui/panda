import { ArtifactFile } from '../artifact-map'

export const preactJsxFactoryArtifact = new ArtifactFile({
  id: 'jsx/factory.js',
  fileName: 'factory',
  type: 'js',
  dir: (ctx) => ctx.paths.jsx,
  dependencies: ['jsx', 'css/index'],
  imports: {
    'jsx/factory-helper.js': [
      'defaultShouldForwardProp',
      'composeShouldForwardProps',
      'composeCvaFn',
      'getDisplayName',
    ],
    'helpers.js': ['splitProps', 'normalizeHTMLProps'],
    'css/index.js': ['css', 'cx', 'cva'],
    'jsx/is-valid-prop.js': ['isCssProperty'],
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
    import { useMemo } from 'preact/hooks'

    function styledFn(Dynamic, configOrCva = {}, options = {}) {
      const cvaFn = configOrCva.__cva__ || configOrCva.__recipe__ ? configOrCva : cva(configOrCva)

      const forwardFn = options.shouldForwardProp || defaultShouldForwardProp
      const shouldForwardProp = (prop) => forwardFn(prop, cvaFn.variantKeys)

      const defaultProps = Object.assign(
        options.dataAttr && configOrCva.__name__ ? { 'data-recipe': configOrCva.__name__ } : {},
        options.defaultProps,
      )

      const __cvaFn__ = composeCvaFn(Dynamic.__cva__, cvaFn)
      const __shouldForwardProps__ = composeShouldForwardProps(Dynamic, shouldForwardProp)
      const __base__ = Dynamic.__base__ || Dynamic

      const ${componentName} = /* @__PURE__ */ forwardRef(function ${componentName}(props, ref) {
        const { as: Element = __base__, children, ...restProps } = props


        const combinedProps = useMemo(() => Object.assign({}, defaultProps, restProps), [restProps])

        const [htmlProps, forwardedProps, variantProps, styleProps, elementProps] = useMemo(() => {
          return splitProps(combinedProps, normalizeHTMLProps.keys, __shouldForwardProps__, __cvaFn__.variantKeys, isCssProperty)
        }, [combinedProps])

        function recipeClass() {
          const { css: cssStyles, ...propStyles } = styleProps
          const compoundVariantStyles = __cvaFn__.__getCompoundVariantCss__?.(variantProps)
          return cx(__cvaFn__(variantProps, false), css(compoundVariantStyles, propStyles, cssStyles), combinedProps.class, combinedProps.className)
        }

        function cvaClass() {
          const { css: cssStyles, ...propStyles } = styleProps
          const cvaStyles = __cvaFn__.raw(variantProps)
          return cx(css(cvaStyles, propStyles, cssStyles), combinedProps.class, combinedProps.className)
        }

        const classes = configOrCva.__recipe__ ? recipeClass : cvaClass

        return h(Element, {
          ...forwardedProps,
          ...elementProps,
          ...normalizeHTMLProps(htmlProps),
          ref,
          className: classes()
        }, combinedProps.children ?? children)
      })

      const name = getDisplayName(__base__)

      ${componentName}.displayName = \`${factoryName}.\${name}\`
      ${componentName}.__cva__ = __cvaFn__
      ${componentName}.__base__ = __base__
      ${componentName}.__shouldForwardProps__ = shouldForwardProp

      return ${componentName}
    }

    function createJsxFactory() {
      const cache = new Map()

      return new Proxy(styledFn, {
        apply(_, __, args) {
          return styledFn(...args)
        },
        get(_, el) {
          if (!cache.has(el)) {
            cache.set(el, styledFn(el))
          }
          return cache.get(el)
        },
      })
    }

    export const ${factoryName} = /* @__PURE__ */ createJsxFactory()
    `
  },
})
