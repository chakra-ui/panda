import { outdent } from 'outdent'
import type { Context } from '../../engines'
import { match } from 'ts-pattern'

export function generateReactJsxFactory(ctx: Context) {
  const { factoryName, componentName } = ctx.jsx

  return {
    js: outdent`
    import { createElement, forwardRef, useMemo } from 'react'
    ${ctx.file.import('css, cx, cva, assignCss', '../css/index')}
    ${ctx.file.import('splitProps, normalizeHTMLProps', '../helpers')}
    ${ctx.jsx.styleProps === 'all' ? ctx.file.import('isCssProperty', './is-valid-prop') : ''}

    function styledFn(Dynamic, configOrCva = {}) {
      const cvaFn = configOrCva.__cva__ || configOrCva.__recipe__ ? configOrCva : cva(configOrCva)

      const ${componentName} = /* @__PURE__ */ forwardRef(function ${componentName}(props, ref) {
        const { as: Element = Dynamic, ...restProps } = props

        ${match(ctx.jsx.styleProps)
          .with('all', () => {
            return outdent`
          const [variantProps, styleProps, htmlProps, elementProps] = useMemo(() => {
            return splitProps(restProps, cvaFn.variantKeys, isCssProperty, normalizeHTMLProps.keys)
          }, [restProps])

          function recipeClass() {
            const { css: cssStyles, ...propStyles } = styleProps
            const styles = assignCss(propStyles, cssStyles)
            return cx(cvaFn(variantProps), css(styles), elementProps.className)
          }

          function cvaClass() {
            const { css: cssStyles, ...propStyles } = styleProps
            const cvaStyles = cvaFn.resolve(variantProps)
            const styles = assignCss(cvaStyles, propStyles, cssStyles)
            return cx(css(styles), elementProps.className)
          }`
          })
          .with('minimal', () => {
            return outdent`
          const [variantProps, htmlProps, elementProps] = useMemo(() => {
            return splitProps(restProps, cvaFn.variantKeys, normalizeHTMLProps.keys)
          }, [restProps])

          function recipeClass() {
            return cx(cvaFn(variantProps), css(assignCss(elementProps.css)), elementProps.className)
          }

          function cvaClass() {
            const cvaStyles = cvaFn.resolve(variantProps)
            const styles = assignCss(cvaStyles, elementProps.css)
            return cx(css(styles), elementProps.className)
          }`
          })
          .with('none', () => {
            return outdent`
          const [variantProps, htmlProps, elementProps] = useMemo(() => {
            return splitProps(restProps, cvaFn.variantKeys, normalizeHTMLProps.keys)
          }, [restProps])

          function recipeClass() {
            return cx(cvaFn(variantProps), elementProps.className)
          }

          function cvaClass() {
            const cvaStyles = cvaFn.resolve(variantProps)
            const styles = assignCss(cvaStyles)
            return cx(css(styles), elementProps.className)
          }`
          })
          .run()}


        const classes = configOrCva.__recipe__ ? recipeClass : cvaClass

        return createElement(Element, {
          ref,
          ...elementProps,
          ...normalizeHTMLProps(htmlProps),
          className: classes(),
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

    export const ${factoryName} = /* @__PURE__ */ createJsxFactory()

    `,
  }
}
