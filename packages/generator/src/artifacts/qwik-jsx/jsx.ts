import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generateQwikJsxFactory(ctx: Context) {
  const { factoryName, componentName } = ctx.jsx

  return {
    js: outdent`
    import { h } from '@builder.io/qwik'
    ${ctx.file.import('css, cx, cva', '../css/index')}
    ${ctx.file.import('splitProps, normalizeHTMLProps', '../helpers')}
    ${ctx.file.import('isCssProperty', './is-valid-prop')}

    function styledFn(Dynamic, configOrCva = {}, options = {}) {
      const cvaFn = configOrCva.__cva__ || configOrCva.__recipe__ ? configOrCva : cva(configOrCva)

      const defaultShouldForwardProp = (prop) => !cvaFn.variantKeys.includes(prop) && !isCssProperty(prop)
      const { dataAttr, shouldForwardProp = defaultShouldForwardProp } = options
      const initialProps = Object.assign(
        dataAttr && configOrCva.recipeName ? { 'data-recipe': configOrCva.recipeName } : {},
        options.defaultProps,
      )

      const ${componentName} = function ${componentName}(props) {
        const { as: Element = Dynamic, className, ...restProps } = props

        const forwardedProps = {}
        const combinedProps = Object.assign({}, initialProps, restProps)
          for (const key in combinedProps) {
          if (shouldForwardProp(key, isCssProperty, cvaFn.variantKeys)) {
            forwardedProps[key] = combinedProps[key]
          }
        }

        const [variantProps, styleProps, htmlProps, elementProps] =
            splitProps(combinedProps, cvaFn.variantKeys, isCssProperty, normalizeHTMLProps.keys)

        const { css: cssStyles, ...propStyles } = styleProps

        function recipeClass() {
          const compoundVariantStyles = cvaFn.__getCompoundVariantCss__?.(variantProps);
          return cx(cvaFn(variantProps, false), css(compoundVariantStyles, propStyles, cssStyles), elementProps.class, className)
        }

        function cvaClass() {
          const cvaStyles = cvaFn.raw(variantProps)
          return cx(css(cvaStyles, propStyles, cssStyles), elementProps.class, className)
        }

        const classes = configOrCva.__recipe__ ? recipeClass : cvaClass

        return h(Element, {
          ...forwardedProps,
          ...elementProps,
          ...normalizeHTMLProps(htmlProps),
          class: classes(),
        })
      }

      const name = (typeof Dynamic === 'string' ? Dynamic : Dynamic.displayName || Dynamic.name) || 'Component'
      ${componentName}.displayName = \`${factoryName}.\${name}\`
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
