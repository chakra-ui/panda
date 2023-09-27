import { outdent } from 'outdent'
import type { Context } from '../../engines'
import { match } from 'ts-pattern'

export function generateSolidJsxFactory(ctx: Context) {
  const { componentName, factoryName } = ctx.jsx
  return {
    js: outdent`
    import { Dynamic } from 'solid-js/web'
    import { mergeProps, splitProps } from 'solid-js'
    import { createComponent } from 'solid-js/web'
    ${ctx.file.import('css, cx, cva', '../css/index')}
    ${ctx.file.import('normalizeHTMLProps', '../helpers')}
    ${ctx.file.import('allCssProperties', './is-valid-prop')}
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

    function styledFn(element, configOrCva = {}, options = {}) {
      const cvaFn = configOrCva.__cva__ || configOrCva.__recipe__ ? configOrCva : cva(configOrCva)

      const forwardFn = options.shouldForwardProp || defaultShouldForwardProp
      const shouldForwardProp = (prop) => forwardFn(prop, cvaFn.variantKeys)
      const initialProps = Object.assign(
        options.dataAttr && configOrCva.__name__ ? { 'data-recipe': configOrCva.__name__ } : {},
        options.defaultProps,
      )

      return function ${componentName}(props) {
        const mergedProps = mergeProps({ as: element }, initialProps, props)
        const forwardedProps = Object.keys(props).filter(shouldForwardProp)

        ${match(ctx.jsx.styleProps)
          .with('all', () => {
            return outdent`
        const [localProps, forwardedProps, variantProps, styleProps, htmlProps, elementProps] = splitProps(
          mergedProps,
          ['as', 'class', 'className'],
          forwardedProps,
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
        }`
          })
          .with('minimal', () => {
            return outdent`
            const [localProps, forwardedProps, variantProps, htmlProps, elementProps] = splitProps(
              mergedProps,
              ['as', 'class'],
              forwardedProps,
              cvaFn.variantKeys,
              allCssProperties,
              normalizeHTMLProps.keys
            )

            function recipeClass() {
              const compoundVariantStyles = cvaFn.__getCompoundVariantCss__?.(variantProps);
              return cx(cvaFn(variantProps, false), css(compoundVariantStyles, combinedProps.css), localProps.class, localProps.className)
            }

            function cvaClass() {
              const cvaStyles = cvaFn.raw(variantProps)
              return cx(css(cvaStyles, combinedProps.css), localProps.class, localProps.className)
            }`
          })
          .with('none', () => {
            return outdent`
            const [localProps, forwardedProps, variantProps, htmlProps, elementProps] = splitProps(
              mergedProps,
              ['as', 'class'],
              forwardedProps,
              cvaFn.variantKeys,
              allCssProperties,
              normalizeHTMLProps.keys
            )

            function recipeClass() {
              const compoundVariantStyles = cvaFn.__getCompoundVariantCss__?.(variantProps);
              return cx(cvaFn(variantProps, false), css(compoundVariantStyles), localProps.class, localProps.className)
            }

            function cvaClass() {
              const cvaStyles = cvaFn.raw(variantProps)
              return cx(css(cvaStyles), localProps.class, localProps.className)
            }`
          })
          .run()}

        const classes = configOrCva.__recipe__ ? recipeClass : cvaClass

        return createComponent(
          Dynamic,
          mergeProps(
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
