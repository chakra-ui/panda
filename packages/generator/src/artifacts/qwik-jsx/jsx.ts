import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generateQwikJsxFactory(ctx: Context) {
  const { factoryName, componentName } = ctx.jsx

  return {
    js: outdent`
    import { h } from '@builder.io/qwik'
    ${ctx.file.import(
      'defaultShouldForwardProp, composeShouldForwardProps, composeCvaFn, getDisplayName',
      './factory-helper',
    )}
    ${ctx.file.import('isCssProperty', './is-valid-prop')}
    ${ctx.file.import('css, cx, cva', '../css/index')}
    ${ctx.file.import('splitProps, normalizeHTMLProps', '../helpers')}

    function styledFn(Dynamic, configOrCva = {}, options = {}) {
      const cvaFn = configOrCva.__cva__ || configOrCva.__recipe__ ? configOrCva : cva(configOrCva)

      const forwardFn = options.shouldForwardProp || defaultShouldForwardProp
      const shouldForwardProp = (prop) => forwardFn(prop, cvaFn.variantKeys)

      const defaultProps = Object.assign(
        options.dataAttr && configOrCva.__name__ ? { 'data-recipe': configOrCva.__name__ } : {},
        options.defaultProps,
      )

      const ${componentName} = function ${componentName}(props) {
        const { as: Element = Dynamic.__base__ || Dynamic, children, className, ...restProps } = props

        const __cvaFn__ = composeCvaFn(Dynamic.__cva__, cvaFn)
        const __shouldForwardProps__ = composeShouldForwardProps(Dynamic, shouldForwardProp)

        const combinedProps = Object.assign({}, defaultProps, restProps)

        const [htmlProps, forwardedProps, variantProps, styleProps, elementProps] =
          splitProps(combinedProps, normalizeHTMLProps.keys, __shouldForwardProps__, __cvaFn__.variantKeys, isCssProperty)

        const { css: cssStyles, ...propStyles } = styleProps

        function recipeClass() {
          const { css: cssStyles, ...propStyles } = styleProps
          const compoundVariantStyles = __cvaFn__.__getCompoundVariantCss__?.(variantProps);
          return cx(__cvaFn__(variantProps, false), css(compoundVariantStyles, propStyles, cssStyles), combinedProps.class, className)
        }

        function cvaClass() {
          const { css: cssStyles, ...propStyles } = styleProps
          const cvaStyles = __cvaFn__.raw(variantProps)
          return cx(css(cvaStyles, propStyles, cssStyles), combinedProps.class, className)
        }

        const classes = configOrCva.__recipe__ ? recipeClass : cvaClass

        return h(Element, {
          ...forwardedProps,
          ...elementProps,
          ...normalizeHTMLProps(htmlProps),
          class: classes(),
        }, combinedProps.children ?? children)
      }

      const name = getDisplayName(Dynamic)

      ${componentName}.displayName = \`${factoryName}.\${name}\`
      ${componentName}.__cva__ = cvaFn
      ${componentName}.__base__ = Dynamic
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

    `,
  }
}
