import { outdent } from 'outdent'
import type { PandaContext } from '../../context'

export function generateSolidJsxFactory(ctx: PandaContext) {
  const { componentName, name } = ctx.jsxFactoryDetails
  return {
    js: outdent`
    import { Dynamic } from 'solid-js/web'
    import { mergeProps, splitProps } from 'solid-js'
    import { allCssProperties } from './is-valid-prop'
    import { css, cx } from '../css'

    const htmlProps = ['htmlSize', 'htmlTranslate', 'htmlWidth', 'htmlHeight']

    function normalizeHtmlProp(key) {
      return htmlProps.includes(key) ? key.replace('html', '').toLowerCase() : key
    }

    function normalizeHtmlProps(props) {
      const result = {}
      for (const [key, value] of Object.entries(props)) {
        result[normalizeHtmlProp(key)] = value
      }
      return result
    }
    
    function styled(element) {
      return function ${componentName}(props) {
        const mergedProps = mergeProps({ as: element }, props)
    
        const [localProps, localHtmlProps, styleProps, elementProps] = splitProps(
          mergedProps,
          ['as', 'class', 'className'],
          htmlProps,
          allCssProperties
        )
    
        const classes = () => {
          const { css: cssStyles, ...otherStyles } = styleProps
          const atomicClass = css({ ...otherStyles, ...cssStyles })
          return cx(atomicClass, localProps.class, localProps.className)
        }
    
        return <Dynamic component={localProps.as} {...normalizeHtmlProps(localHtmlProps)} {...elementProps} class={classes()} />
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
