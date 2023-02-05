import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generateSolidJsxFactory(ctx: Context) {
  const { componentName, factoryName } = ctx.jsx
  return {
    js: outdent`
    import { Dynamic } from 'solid-js/web'
    import { mergeProps, splitProps } from 'solid-js'
    import { createComponent } from 'solid-js/web'
    ${ctx.file.import('css, cx, cva, assignCss', '../css/index')}
    ${ctx.file.import('normalizeHTMLProps', '../helpers')}
    ${ctx.file.import('allCssProperties', './is-valid-prop')}
    
    function styled(element, configOrCva = {}) {
      const cvaFn = configOrCva.__cva__ ? configOrCva : cva(configOrCva)
      
      return function ${componentName}(props) {
        const mergedProps = mergeProps({ as: element }, props)
    
        const [localProps, styleProps, variantProps, htmlProps, elementProps] = splitProps(
          mergedProps,
          ['as', 'class'],
          allCssProperties,
          cvaFn.variants,
          normalizeHTMLProps.keys
        )
    
        const classes = () => {
          const { css: cssStyles, ...propStyles } = styleProps
          const cvaStyles = cvaFn.resolve(variantProps)
          const styles = assignCss(cvaStyles, propStyles, cssStyles)
          return cx(css(styles), localProps.class)
        }
    
        return createComponent(
          Dynamic,
          mergeProps(
            {
              get component() {
                return localProps.as
              },
              get class() {
                return classes()
              }
            },
            elementProps,
            normalizeHTMLProps(htmlProps)
          )
        )
      }
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
