import type { Context } from '@pandacss/core'
import { outdent } from 'outdent'

export function generatePreactJsxStringLiteralFactory(ctx: Context) {
  const { factoryName, componentName } = ctx.jsx

  return {
    js: outdent`
    import { h } from 'preact'
    import { forwardRef } from 'preact/compat'
    ${ctx.file.import('getDisplayName', './factory-helper')}
    ${ctx.file.import('css, cx', '../css/index')}

    function createStyledFn(Dynamic) {
      const __base__ = Dynamic.__base__ || Dynamic
      return function styledFn(template) {
        const styles = css.raw(template)

        const ${componentName} = /* @__PURE__ */ forwardRef(function ${componentName}(props, ref) {
          const { as: Element = __base__, ...elementProps } = props

          function classes() {
            return cx(css(Dynamic.__styles__, styles), elementProps.className)
          }

          return h(Element, {
            ref,
            ...elementProps,
            className: classes(),
          })
        })

        const name = getDisplayName(__base__)

        ${componentName}.displayName = \`${factoryName}.\${name}\`
        ${componentName}.__styles__ = styles
        ${componentName}.__base__ = __base__

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
