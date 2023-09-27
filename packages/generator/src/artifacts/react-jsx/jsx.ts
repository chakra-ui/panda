import { outdent } from 'outdent'
import type { Context } from '../../engines'
import { match } from 'ts-pattern'

export function generateReactJsxFactory(ctx: Context) {
  const { factoryName, componentName } = ctx.jsx

  return {
    js: outdent`
    import { createElement, forwardRef, useMemo } from 'react'
    ${ctx.file.import('css, cx, cva', '../css/index')}
    ${ctx.file.import('splitProps, normalizeHTMLProps', '../helpers')}
    ${ctx.jsx.styleProps === 'all' ? ctx.file.import('isCssProperty', './is-valid-prop') : ''}

    ${match(ctx.jsx.styleProps)
      .with(
        'all',
        () => outdent`
    const defaultShouldForwardProp = (prop, variantKeys) => !variantKeys.includes(prop) && !isCssProperty(prop)
    `,
      )
      .otherwise(
        () => outdent`
    const defaultShouldForwardProp = (prop, variantKeys) => !variantKeys.includes(prop)
    `,
      )}

    function styledFn(Dynamic, configOrCva = {}, options = {}) {
      const cvaFn = configOrCva.__cva__ || configOrCva.__recipe__ ? configOrCva : cva(configOrCva)

      const forwardFn = options.shouldForwardProp || defaultShouldForwardProp
      const shouldForwardProp = (prop) => forwardFn(prop, cvaFn.variantKeys)
      const initialProps = Object.assign(
        options.dataAttr && configOrCva.__name__ ? { 'data-recipe': configOrCva.__name__ } : {},
        options.defaultProps,
      )

      const ${componentName} = /* @__PURE__ */ forwardRef(function ${componentName}(props, ref) {
        const { as: Element = Dynamic, children, ...restProps } = props

        const combinedProps = useMemo(() => Object.assign({}, initialProps, restProps), [restProps])

        ${match(ctx.jsx.styleProps)
          .with('all', () => {
            return outdent`
          const [forwardedProps, variantProps, styleProps, htmlProps, elementProps] = useMemo(() => {
            return splitProps(combinedProps, shouldForwardProp, cvaFn.variantKeys, isCssProperty, normalizeHTMLProps.keys)
          }, [combinedProps])

          function recipeClass() {
            const { css: cssStyles, ...propStyles } = styleProps
            const compoundVariantStyles = cvaFn.__getCompoundVariantCss__?.(variantProps);
            return cx(cvaFn(variantProps, false), css(compoundVariantStyles, propStyles, cssStyles), combinedProps.className)
          }

          function cvaClass() {
            const { css: cssStyles, ...propStyles } = styleProps
            const cvaStyles = cvaFn.raw(variantProps)
            return cx(css(cvaStyles, propStyles, cssStyles), combinedProps.className)
          }`
          })
          .with('minimal', () => {
            return outdent`
          const [forwardedProps, variantProps, htmlProps, elementProps] = useMemo(() => {
            return splitProps(combinedProps, shouldForwardProp, cvaFn.variantKeys, normalizeHTMLProps.keys)
          }, [combinedProps])

          function recipeClass() {
            const compoundVariantStyles = cvaFn.__getCompoundVariantCss__?.(variantProps);
            return cx(cvaFn(variantProps, false), css(compoundVariantStyles, combinedProps.css), combinedProps.className)
          }

          function cvaClass() {
            const cvaStyles = cvaFn.raw(variantProps)
            return cx(css(cvaStyles, combinedProps.css), combinedProps.className)
          }`
          })
          .with('none', () => {
            return outdent`
          const [forwardedProps, variantProps, htmlProps, elementProps] = useMemo(() => {
            return splitProps(combinedProps, shouldForwardProp, cvaFn.variantKeys, normalizeHTMLProps.keys)
          }, [combinedProps])

          function recipeClass() {
            const compoundVariantStyles = cvaFn.__getCompoundVariantCss__?.(variantProps);
            return cx(cvaFn(variantProps, false), css(compoundVariantStyles), combinedProps.className)
          }

          function cvaClass() {
            const cvaStyles = cvaFn.raw(variantProps)
            return cx(css(cvaStyles), combinedProps.className)
          }`
          })
          .run()}


        const classes = configOrCva.__recipe__ ? recipeClass : cvaClass

        return createElement(Element, {
          ref,
          ...forwardedProps,
          ...elementProps,
          ...normalizeHTMLProps(htmlProps),
          children,
          className: classes(),
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
