import { outdent } from 'outdent'
import type { PandaContext } from '../../context'

export function generateSolidJsxFactory(ctx: PandaContext) {
  const { componentName, name } = ctx.jsxFactoryDetails
  return {
    js: outdent`
    import { Dynamic } from 'solid-js/web'
    import { mergeProps, splitProps } from 'solid-js'
    import { css, cx, assignCss } from '../css'
    import { splitProps, normalizeHTMLProps } from '../helpers'
    import { allCssProperties } from './is-valid-prop'
    
    function styled(element, configOrCva = {}) {
      const cvaFn = configOrCva.__cva__ ? configOrCva : cva(configOrCva)
      
      return function ${componentName}(props) {
        const mergedProps = mergeProps({ as: element }, props)
    
        const [localProps, styleProps, htmlProps, elementProps] = splitProps(
          mergedProps,
          ['as', 'class'],
          allCssProperties,
          normalizeHTMLProps.keys
        )
    
        const classes = () => {
          const { css: cssStyles, ...propStyles } = styleProps
          const cvaStyles = cvaFn.resolve(variantProps)
          const styles = assignCss(cvaStyles, propStyles, cssStyles)
          return cx(css(styles), localProps.class)
        }
    
        return (
          <Dynamic
            component={localProps.as}
            {...elementProps}
            {...normalizeHtmlProps(htmlProps)}
            class={classes()}
          />
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
      
    export const ${name} = createJsxFactory()
    `,
  }
}
