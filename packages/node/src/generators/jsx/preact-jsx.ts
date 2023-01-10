import { outdent } from 'outdent'
import type { PandaContext } from '../../context'

export function generatePreactJsxFactory(ctx: PandaContext) {
  const { name, componentName } = ctx.jsxFactoryDetails

  return {
    js: outdent`
    import { h } from 'preact'
    import { forwardRef } from 'preact/compat'
    import { useMemo } from 'preact/hooks'
    import { isCssProperty } from './is-valid-prop'
    import { css, cx } from '../css'
  
    const htmlProps = ['htmlSize', 'htmlTranslate', 'htmlWidth', 'htmlHeight']

    function normalizeHtmlProp(key) {
      return htmlProps.includes(key) ? key.replace('html', '').toLowerCase() : key
    }
    
    function splitProps(props) {
      const styleProps = {}
      const elementProps = {}
    
      for (const [key, value] of Object.entries(props)) {
        if (isCssProperty(key)) {
          styleProps[key] = value
        } else {
          elementProps[normalizeHtmlProp(key)] = value
        }
      }
    
      return [styleProps, elementProps]
    }
    
    function styled(Dynamic) {
      const ${componentName} = forwardRef(function ${componentName}(props, ref) {
        const { as: Element = Dynamic, ...restProps } = props

        const [styleProps, elementProps] = useMemo(() => splitProps(restProps), [restProps])
    
        function classes(){
          const { css: cssStyles, ...otherStyles } = styleProps
          const atomicClass = css({ ...otherStyles, ...cssStyles })
          return cx(atomicClass, elementProps.className)
        }
    
        return h(Element, { ...elementProps, ref, className: classes() })
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
