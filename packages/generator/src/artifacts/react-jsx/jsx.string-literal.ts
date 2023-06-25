import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generateReactJsxStringLiteralFactory(ctx: Context) {
  const { factoryName, componentName } = ctx.jsx

  return {
    js: outdent`
    import { createElement, forwardRef } from 'react'
    ${ctx.file.import('css, cx', '../css/index')}
    
    function createStyledFn(Dynamic) {
      return function styledFn(template) {
        const baseClassName = css(template)
        const ${componentName} = forwardRef(function ${componentName}(props, ref) {
            const { as: Element = Dynamic, ...elementProps } = props
            const classes = () => cx(baseClassName, elementProps.className)
        
            return createElement(Element, {
                ref,
                ...elementProps,
                className: classes(),
            })
        })
        
        ${componentName}.displayName = \`${factoryName}.\${Dynamic}\`
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

    export const ${factoryName} = createJsxFactory()

    `,
  }
}
