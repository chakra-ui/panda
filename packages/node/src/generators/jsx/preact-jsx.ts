import { capitalize } from '@pandacss/shared'
import { outdent } from 'outdent'
import type { PandaContext } from '../../context'

export function generatePreactJsxFactory(ctx: PandaContext) {
  const name = ctx.jsxFactory
  const upperName = capitalize(name)

  return {
    dts: outdent`
    import type { ComponentProps, JSX } from 'preact'
    import type { JSXStyleProperties } from '../types'
    
    type Element = keyof JSX.IntrinsicElements
    
    export type HTML${upperName}Props<T extends Element> = Omit<ComponentProps<T>, 'color'> | JSXStyleProperties
    

    type JSXFactory = {
      [K in Element]: (props: HTML${upperName}Props<K>) => JSX.Element
    }

    export declare const ${name}: JSXFactory
    `,
    js: outdent`
    import { h } from 'preact'
    import { forwardRef } from 'preact/compat'
    import { isCssProperty } from './is-valid-prop'
    import { css } from '../css'
    
    function cx(...args) {
      return args.filter(Boolean).join(' ')
    }
    
    function splitProps(props) {
      const styleProps = {}
      const elementProps = {}
    
      for (const [key, value] of Object.entries(props)) {
        if (isCssProperty(key)) {
          styleProps[key] = value
        } else {
          elementProps[key] = value
        }
      }
    
      return [styleProps, elementProps]
    }
    
    function styled(Dynamic) {
      const ${upperName}Component = forwardRef((props, ref) => {
        const { as: Element = Dynamic, ...restProps } = props

        const [styleProps, elementProps] = splitProps(restProps)
    
        const classes = () => {
          const { css: cssStyles, ...otherStyles } = styleProps
          const atomicClass = css({ ...otherStyles, ...cssStyles })
          return cx(atomicClass, elementProps.className)
        }
    
        return h(Element, { ...elementProps, ref, className: classes() })
      })
      
      ${upperName}Component.displayName = \`${name}.\${Dynamic}\`
      return ${upperName}Component
    }
    
    function createFactory() {
      const cache = new Map()
    
      return new Proxy(Object.create(null), {
        get(_, el) {
          if (!cache.has(el)) {
            cache.set(el, styled(el))
          }
          return cache.get(el)
        },
      })
    }

    export const ${name} = createFactory()
    `,
  }
}
