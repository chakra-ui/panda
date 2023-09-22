import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generateSolidJsxFactory(ctx: Context) {
  const { componentName, factoryName } = ctx.jsx
  return {
    js: outdent`
    import { Dynamic } from 'solid-js/web'
    import { mergeProps, splitProps } from 'solid-js'
    import { createComponent } from 'solid-js/web'
    ${ctx.file.import('css, cx, cva, assignCss', '../css/index')}
    ${ctx.file.import('normalizeHTMLProps', '../helpers')}
    ${ctx.file.import('allCssProperties', './is-valid-prop')}

    function styledFn(element, configOrCva = {}, options = {}) {
      const cvaFn = configOrCva.__cva__ || configOrCva.__recipe__ ? configOrCva : cva(configOrCva)

      const defaultShouldForwardProp = (prop) => !cvaFn.variantKeys.includes(prop) && !isCssProperty(prop)
      const { dataAttr, shouldForwardProp = defaultShouldForwardProp } = options
      const initialProps = Object.assign(
        dataAttr && configOrCva.recipeName ? { 'data-recipe': configOrCva.recipeName } : {},
        options.defaultProps,
      )

      return function ${componentName}(props) {
        const mergedProps = mergeProps({ as: element }, props)

        const forwardedProps = {}
        for (const key in restProps) {
          if (shouldForwardProp(key, isCssProperty)) {
            forwardedProps[key] = restProps[key]
          }
        }

        const [localProps, variantProps, styleProps, htmlProps, elementProps] = splitProps(
          mergedProps,
          ['as', 'class', 'className'],
          cvaFn.variantKeys,
          allCssProperties,
          normalizeHTMLProps.keys
        )

        function recipeClass() {
          const { css: cssStyles, ...propStyles } = styleProps
          const compoundVariantStyles = cvaFn.__getCompoundVariantCss__?.(variantProps);
          return cx(cvaFn(variantProps, false), css(compoundVariantStyles, propStyles, cssStyles), localProps.class, localProps.className)
        }

        function cvaClass() {
          const { css: cssStyles, ...propStyles } = styleProps
          const cvaStyles = cvaFn.raw(variantProps)
          return cx(css(cvaStyles, propStyles, cssStyles), localProps.class, localProps.className)
        }

        const classes = configOrCva.__recipe__ ? recipeClass : cvaClass

        return createComponent(
          Dynamic,
          mergeProps(
            initialProps,
            forwardedProps,
            elementProps,
            normalizeHTMLProps(htmlProps)
            {
              get component() {
                return localProps.as
              },
              get class() {
                return classes()
              }
            },
          )
        )
      }
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
