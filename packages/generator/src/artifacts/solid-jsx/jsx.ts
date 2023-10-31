import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generateSolidJsxFactory(ctx: Context) {
  const { componentName, factoryName } = ctx.jsx
  return {
    js: outdent`
    import { Dynamic } from 'solid-js/web'
    import { createMemo, mergeProps, splitProps } from 'solid-js'
    import { createComponent } from 'solid-js/web'
    ${ctx.file.import(
      'defaultShouldForwardProp, composeShouldForwardProps, composeCvaFn, getDisplayName',
      './factory-helper',
    )}
    ${ctx.file.import('isCssProperty', './is-valid-prop')}
    ${ctx.file.import('css, cx, cva', '../css/index')}
    ${ctx.file.import('normalizeHTMLProps', '../helpers')}

    function styledFn(element, configOrCva = {}, options = {}) {
      const cvaFn = configOrCva.__cva__ || configOrCva.__recipe__ ? configOrCva : cva(configOrCva)

      const forwardFn = options.shouldForwardProp || defaultShouldForwardProp
      const shouldForwardProp = (prop) => forwardFn(prop, cvaFn.variantKeys)

      const defaultProps = Object.assign(
        options.dataAttr && configOrCva.__name__ ? { 'data-recipe': configOrCva.__name__ } : {},
        options.defaultProps,
      )

      const ${componentName} = (props) => {
        const mergedProps = mergeProps({ as: element.__base__ || element }, defaultProps, props)

        const __cvaFn__ = composeCvaFn(Dynamic.__cva__, cvaFn)
        const __shouldForwardProps__ = composeShouldForwardProps(Dynamic, shouldForwardProp)

        const forwardedKeys = createMemo(() =>
          Object.keys(props).filter((prop) => !normalizeHTMLProps.keys.includes(prop) && shouldForwardProp(prop)),
        )

        const [localProps, htmlProps, forwardedProps, restProps] = splitProps(
          mergedProps,
          ['as', 'class', 'className'],
          normalizeHTMLProps.keys,
          forwardedKeys()
        )

        const cssPropertyKeys = createMemo(() => Object.keys(restProps).filter((prop) => isCssProperty(prop)))

        const [variantProps, styleProps, elementProps] = splitProps(
          restProps,
          __cvaFn__.variantKeys,
          cssPropertyKeys(),
        )

        function recipeClass() {
          const { css: cssStyles, ...propStyles } = styleProps
          const compoundVariantStyles = __cvaFn__.__getCompoundVariantCss__?.(variantProps);
          return cx(__cvaFn__(variantProps, false), css(compoundVariantStyles, propStyles, cssStyles), localProps.class, localProps.className)
        }

        function cvaClass() {
          const { css: cssStyles, ...propStyles } = styleProps
          const cvaStyles = __cvaFn__.raw(variantProps)
          return cx(css(cvaStyles, propStyles, cssStyles), localProps.class, localProps.className)
        }

        const classes = configOrCva.__recipe__ ? recipeClass : cvaClass

        if (forwardedProps.className) {
          delete forwardedProps.className
        }

        return createComponent(
          Dynamic,
          mergeProps(
            forwardedProps,
            elementProps,
            normalizeHTMLProps(htmlProps),
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

      const name = getDisplayName(element)

      ${componentName}.displayName = \`${factoryName}.\${name}\`
      ${componentName}.__cva__ = cvaFn
      ${componentName}.__base__ = element
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
