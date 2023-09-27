import { outdent } from 'outdent'
import type { Context } from '../../engines'
import { match } from 'ts-pattern'

export function generateQwikJsxFactory(ctx: Context) {
  const { factoryName, componentName } = ctx.jsx

  return {
    js: outdent`
    import { h } from '@builder.io/qwik'
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

      const ${componentName} = function ${componentName}(props) {
        const { as: Element = Dynamic, children, className, ...restProps } = props

        const combinedProps = Object.assign({}, initialProps, restProps)
        ${match(ctx.jsx.styleProps)
          .with('all', () => {
            return outdent`
          const [forwardedProps, variantProps, styleProps, htmlProps, elementProps] =
            splitProps(combinedProps, shouldForwardProp, cvaFn.variantKeys, isCssProperty, normalizeHTMLProps.keys)

          const { css: cssStyles, ...propStyles } = styleProps

          function recipeClass() {
            const compoundVariantStyles = cvaFn.__getCompoundVariantCss__?.(variantProps);
            return cx(cvaFn(variantProps, false), css(compoundVariantStyles, propStyles, cssStyles), combinedProps.class, className)
          }

          function cvaClass() {
            const cvaStyles = cvaFn.raw(variantProps)
            return cx(css(cvaStyles, propStyles, cssStyles), combinedProps.class, className)
          }`
          })
          .with('minimal', () => {
            return outdent`
            const [forwardedProps, variantProps, htmlProps, elementProps] =
            splitProps(combinedProps, shouldForwardProp, cvaFn.variantKeys, normalizeHTMLProps.keys)

          function recipeClass() {
            const compoundVariantStyles = cvaFn.__getCompoundVariantCss__?.(variantProps);
            return cx(cvaFn(variantProps, false), css(compoundVariantStyles, combinedProps.css), combinedProps.class, className)
          }

          function cvaClass() {
            const cvaStyles = cvaFn.raw(variantProps)
            return cx(css(cvaStyles, combinedProps.css), combinedProps.class, className)`
          })
          .with('none', () => {
            return outdent`
            const [forwardedProps, variantProps, htmlProps, elementProps] =
            splitProps(combinedProps, shouldForwardProp, cvaFn.variantKeys, normalizeHTMLProps.keys)

          function recipeClass() {
            const compoundVariantStyles = cvaFn.__getCompoundVariantCss__?.(variantProps);
            return cx(cvaFn(variantProps, false), css(compoundVariantStyles), combinedProps.class, className)
          }

          function cvaClass() {
            const cvaStyles = cvaFn.raw(variantProps)
            return cx(css(cvaStyles), combinedProps.class, className)`
          })
          .run()}

        const classes = configOrCva.__recipe__ ? recipeClass : cvaClass

        return h(Element, {
          ...forwardedProps,
          ...elementProps,
          ...normalizeHTMLProps(htmlProps),
          children,
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
