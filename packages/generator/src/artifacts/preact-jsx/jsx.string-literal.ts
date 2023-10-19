import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generatePreactJsxStringLiteralFactory(ctx: Context) {
  const { factoryName, componentName } = ctx.jsx

  return {
    js: outdent`
    import { h } from 'preact'
    import { forwardRef } from 'preact/compat'
    ${ctx.file.import('css, cx', '../css/index')}

    function createStyledFn(Dynamic) {
      return function styledFn(template) {
        const styles = css.raw(template)

        const ${componentName} = /* @__PURE__ */ forwardRef(function ${componentName}(props, ref) {
          const { as: Element = Dynamic.__base__ || Dynamic, ...elementProps } = props
         
          const __styles__ = mergeProps(Dynamic.__styles__, styles)

          function classes() {
            return cx(css(__styles__), elementProps.className)
          }

          return h(Element, {
            ref,
            ...elementProps,
            className: classes(),
          })
        })

        const name = (typeof Dynamic === 'string' ? Dynamic : Dynamic.displayName || Dynamic.name) || 'Component'
        
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
