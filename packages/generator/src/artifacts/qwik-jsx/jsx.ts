import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generateQwikJsxFactory(ctx: Context) {
  const { factoryName, componentName } = ctx.jsx

  return {
    js: outdent`
    import { h } from '@builder.io/qwik'
    ${ctx.file.import('css, cx, cva, assignCss', '../css/index')}
    ${ctx.file.import('splitProps, normalizeHTMLProps', '../helpers')}
    ${ctx.file.import('isCssProperty', './is-valid-prop')}

    function styledFn(Dynamic, configOrCva = {}) {
      const cvaFn = configOrCva.__cva__ || configOrCva.__recipe__ ? configOrCva : cva(configOrCva)

      const ${componentName} = function ${componentName}(props) {
        const { as: Element = Dynamic, ...restProps } = props

        const [variantProps, styleProps, htmlProps, elementProps] =
            splitProps(restProps, cvaFn.variantKeys, isCssProperty, normalizeHTMLProps.keys)

        const { css: cssStyles, ...propStyles } = styleProps

        function recipeClass() {
          const styles = assignCss(propStyles, cssStyles)
          return cx(cvaFn(variantProps), css(styles), elementProps.class)
        }

        function cvaClass() {
          const cvaStyles = cvaFn.raw(variantProps)
          const styles = assignCss(cvaStyles, propStyles, cssStyles)
          return cx(css(styles), elementProps.class)
        }

        const classes = configOrCva.__recipe__ ? recipeClass : cvaClass

        return h(Element, {
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
