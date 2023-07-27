import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generatePreactJsxFactory(ctx: Context) {
  const { factoryName, componentName } = ctx.jsx

  return {
    js: outdent`
    import { h } from 'preact'
    import { forwardRef } from 'preact/compat'
    import { useMemo } from 'preact/hooks'
    ${ctx.file.import('css, cx, assignCss', '../css/index')}
    ${ctx.file.import('splitProps, normalizeHTMLProps', '../helpers')}
    ${ctx.file.import('isCssProperty', './is-valid-prop')}

    function styledFn(Dynamic, configOrCva = {}) {
      const cvaFn = configOrCva.__cva__ || configOrCva.__recipe__ ? configOrCva : cva(configOrCva)

      const ${componentName} = /* @__PURE__ */ forwardRef(function ${componentName}(props, ref) {
        const { as: Element = Dynamic, ...restProps } = props

        const [variantProps, styleProps, htmlProps, elementProps] = useMemo(() => {
          return splitProps(restProps, cvaFn.variantKeys, isCssProperty, normalizeHTMLProps.keys)
        }, [restProps])

        function recipeClass() {
          const { css: cssStyles, ...propStyles } = styleProps
          const styles = assignCss(propStyles, cssStyles)
          return cx(cvaFn(variantProps), css(styles), elementProps.className, elementProps.class)
        }

        function cvaClass() {
          const { css: cssStyles, ...propStyles } = styleProps
          const cvaStyles = cvaFn.resolve(variantProps)
          const styles = assignCss(cvaStyles, propStyles, cssStyles)
          return cx(css(styles), elementProps.className, elementProps.class)
        }

        const classes = configOrCva.__recipe__ ? recipeClass : cvaClass

        return h(Element, {
          ...elementProps,
          ...normalizeHTMLProps(htmlProps),
          ref,
          className: classes()
        })
      })

      ${componentName}.displayName = \`${factoryName}.\${Dynamic}\`
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

    export const ${factoryName} = createJsxFactory()
    `,
  }
}
