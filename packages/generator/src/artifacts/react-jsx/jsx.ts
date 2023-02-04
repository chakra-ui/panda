import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generateReactJsxFactory(ctx: Context) {
  const { factoryName, componentName } = ctx.jsx

  return {
    js: outdent`
    import { createElement, forwardRef, useMemo } from 'react'
    ${ctx.file.import('css, cx, cva, assignCss', '../css/index')}
    ${ctx.file.import('splitProps, normalizeHTMLProps', '../helpers')}
    ${ctx.file.import('isCssProperty', './is-valid-prop')}
    
    function styled(Dynamic, configOrCva = {}) {
      const cvaFn = configOrCva.__cva__ ? configOrCva : cva(configOrCva)
      
      const ${componentName} = forwardRef(function ${componentName}(props, ref) {
        const { as: Element = Dynamic, ...restProps } = props
    
        const [styleProps, variantProps, htmlProps, elementProps] = useMemo(() => {
          return splitProps(restProps, isCssProperty, cvaFn.variants, normalizeHTMLProps.keys)
        }, [restProps])
    
        function classes() {
          const { css: cssStyles, ...propStyles } = styleProps
          const cvaStyles = cvaFn.resolve(variantProps)
          const styles = assignCss(cvaStyles, propStyles, cssStyles)
          return cx(css(styles), elementProps.className)
        }
    
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
    
      return new Proxy(styled, {
        apply(_, __, args) {
          return styled(...args)
        },
        get(_, el) {
          if (!cache.has(el)) {
            cache.set(el, styled(el))
          }
          return cache.get(el)
        },
      })
    }

    export const ${factoryName} = createJsxFactory()

    `,
  }
}
