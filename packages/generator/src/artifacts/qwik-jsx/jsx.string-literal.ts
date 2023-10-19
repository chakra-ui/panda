import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generateQwikJsxStringLiteralFactory(ctx: Context) {
  const { factoryName, componentName } = ctx.jsx

  return {
    js: outdent`
    import { h } from '@builder.io/qwik'
    ${ctx.file.import('getDisplayName', './factory-helper')}
    ${ctx.file.import('css, cx', '../css/index')}

    function createStyledFn(Dynamic) {
      return function styledFn(template) {
          const styles = css.raw(template)
          
          const ${componentName} = (props) => {
            const { as: Element = Dynamic.__base__ || Dynamic, ...elementProps } = props
            
            function classes() {
              return cx(css(Dynamic.__styles__, styles), elementProps.className)
            }

            return h(Element, {
              ...elementProps,
              className: classes(),
            })
          }

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
