import type { Context } from '@pandacss/core'
import { outdent } from 'outdent'

export function generateSolidJsxFactory(ctx: Context) {
  const { componentName, factoryName } = ctx.jsx
  return {
    js: outdent`
    import { createMemo, mergeProps, splitProps } from 'solid-js'
    import { Dynamic, createComponent } from 'solid-js/web'
    ${ctx.file.import('css, cx, cva', '../css/index')}
    ${ctx.file.import('normalizeHTMLProps', '../helpers')}
    ${ctx.file.import(
      'composeCvaFn, composeShouldForwardProps, defaultShouldForwardProp, getDisplayName',
      './factory-helper',
    )}
    ${ctx.file.import('isCssProperty', './is-valid-prop')}

    function styledFn(element, configOrCva = {}, options = {}) {
      const cvaFn =
        configOrCva.__cva__ || configOrCva.__recipe__
          ? configOrCva
          : cva(configOrCva)

      const forwardFn = options.shouldForwardProp || defaultShouldForwardProp
      const shouldForwardProp = (prop) => forwardFn(prop, cvaFn.variantKeys)

      const defaultProps = Object.assign(
        options.dataAttr && configOrCva.__name__
          ? { 'data-recipe': configOrCva.__name__ }
          : {},
        options.defaultProps
      )

      const __cvaFn__ = composeCvaFn(element.__cva__, cvaFn)
      const __shouldForwardProps__ = composeShouldForwardProps(
        element,
        shouldForwardProp
      )

      const ${componentName} = (props) => {
        const mergedProps = mergeProps(
          { as: element.__base__ || element },
          defaultProps,
          props
        )

        const [localProps, restProps] = splitProps(mergedProps, [
          'as',
          'class',
          'className',
        ])

        const [htmlProps, aProps] = splitProps(restProps, normalizeHTMLProps.keys)

        const forwardedKeys = createMemo(() => {
          const keys = Object.keys(aProps)
          return keys.filter((prop) => __shouldForwardProps__(prop))
        })

        const [forwardedProps, variantProps, bProps] = splitProps(aProps, forwardedKeys(), __cvaFn__.variantKeys)

        const cssPropKeys = createMemo(() => {
          const keys = Object.keys(bProps)
          return keys.filter((prop) => isCssProperty(prop))
        })

        const [styleProps, elementProps] = splitProps(bProps, cssPropKeys())

        function recipeClass() {
          const { css: cssStyles, ...propStyles } = styleProps
          const compoundVariantStyles =
            __cvaFn__.__getCompoundVariantCss__?.(variantProps)
          return cx(
            __cvaFn__(variantProps, false),
            css(compoundVariantStyles, propStyles, ...(Array.isArray(cssStyles) ? cssStyles : [cssStyles])),
            localProps.class,
            localProps.className
          )
        }

        function cvaClass() {
          const { css: cssStyles, ...propStyles } = styleProps
          const cvaStyles = __cvaFn__.raw(variantProps)
          return cx(
            css(cvaStyles, propStyles, ...(Array.isArray(cssStyles) ? cssStyles : [cssStyles])),
            localProps.class,
            localProps.className
          )
        }

        const classes = configOrCva.__recipe__ ? recipeClass : cvaClass

        if (forwardedProps.className) {
          delete forwardedProps.className
        }

        return createComponent(
          Dynamic,
          mergeProps(forwardedProps, elementProps, normalizeHTMLProps(htmlProps), {
            get component() {
              return localProps.as
            },
            get class() {
              return classes()
            },
          })
        )
      }

      const name = getDisplayName(element)

      ${componentName}.displayName = \`${factoryName}.\${name}\`
      ${componentName}.__cva__ = __cvaFn__
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
