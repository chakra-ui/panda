import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generatePreactJsxFactory(ctx: Context) {
  const { factoryName, componentName } = ctx.jsx

  return {
    js: outdent`
    import { h } from 'preact'
    import { forwardRef } from 'preact/compat'
    import { useMemo } from 'preact/hooks'
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

      const ${componentName} = /* @__PURE__ */ forwardRef(function ${componentName}(props, ref) {
        const { as: Element = Dynamic, ...restProps } = props

        const forwardedProps = useMemo(() => {
          const props = {}
          for (const key in restProps) {
            if (shouldForwardProp(key, isCssProperty)) {
              props[key] = restProps[key]
            }
          }

          return props
        }, [restProps, shouldForwardProp])

        const [variantProps, styleProps, htmlProps, elementProps] = useMemo(() => {
          return splitProps(restProps, cvaFn.variantKeys, isCssProperty, normalizeHTMLProps.keys)
        }, [restProps])

        function recipeClass() {
          const { css: cssStyles, ...propStyles } = styleProps
          const compoundVariantStyles = cvaFn.__getCompoundVariantCss__?.(variantProps);
          return cx(cvaFn(variantProps, false), css(compoundVariantStyles, propStyles, cssStyles), elementProps.className, elementProps.class)
        }

        function cvaClass() {
          const { css: cssStyles, ...propStyles } = styleProps
          const cvaStyles = cvaFn.raw(variantProps)
          return cx(css(cvaStyles, propStyles, cssStyles), elementProps.className, elementProps.class)
        }

        const classes = configOrCva.__recipe__ ? recipeClass : cvaClass

        return h(Element, {
          ...initialProps,
          ...forwardedProps,
          ...elementProps,
          ...normalizeHTMLProps(htmlProps),
          ref,
          className: classes()
        })
      })

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
