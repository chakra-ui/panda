import type { Context } from '@pandacss/core'
import { outdent } from 'outdent'

export function generateReactJsxStringLiteralFactory(ctx: Context) {
  const factoryName = `x${ctx.jsx.factoryName}`
  const componentName = `X${ctx.jsx.componentName}`

  return {
    js: outdent`
    import { createElement, forwardRef } from 'react'
    ${ctx.file.import('getDisplayName', './factory-helper')}
    ${ctx.file.import('xcss, cx', '../css/index')}

    function createStyledFn(Dynamic) {
      return function styledFn(template) {
        const styles = xcss.raw(template)

        const ${componentName} = /* @__PURE__ */ forwardRef(function ${componentName}(props, ref) {
          const { as: Element = Dynamic.__base__ || Dynamic, ...elementProps } = props

          function classes() {
            return cx(xcss(Dynamic.__styles__, styles), elementProps.className)
          }

          return createElement(Element, {
              ref,
              ...elementProps,
              className: classes(),
          })
        })

        const name = getDisplayName(Dynamic)

        ${componentName}.displayName = \`${factoryName}.\${name}\`
        ${componentName}.__styles__ = styles
        ${componentName}.__base__ = Dynamic

        return ${componentName}
      }
    }

    function createJsxFactory() {
      const cache = new Map()

      return new Proxy(createStyledFn, {
        apply(_, __, args) {
          return createStyledFn(...args)
        },
        get(_, el) {
          if (!cache.has(el)) {
            cache.set(el, createStyledFn(el))
          }
          return cache.get(el)
        },
      })
    }

    export const ${factoryName} = /* @__PURE__ */ createJsxFactory()

    `,
  }
}
