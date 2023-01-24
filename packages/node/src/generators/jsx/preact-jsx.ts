import { outdent } from 'outdent'
import type { PandaContext } from '../../context'

export function generatePreactJsxFactory(ctx: PandaContext) {
  const { name, componentName } = ctx.jsxFactoryDetails

  return {
    js: outdent`
    import { h } from 'preact'
    import { forwardRef } from 'preact/compat'
    import { useMemo } from 'preact/hooks'
    ${ctx.getImport('css, cx, assignCss', '../css/index')}
    ${ctx.getImport('splitProps, normalizeHTMLProps', '../helpers')}
    ${ctx.getImport('isCssProperty', './is-valid-prop')}
    
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
    
        return h(Element, {
          ...elementProps,
          ...normalizeHTMLProps(htmlProps),
          ref,
          className: classes()
        })
      })
      
      ${componentName}.displayName = \`${name}.\${Dynamic}\`
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

    export const ${name} = createJsxFactory()
    `,
  }
}
