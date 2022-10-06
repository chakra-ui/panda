import { outdent } from 'outdent'
import type { PandaContext } from '../../context'

export function generateReactJsxFactory(ctx: PandaContext) {
  const name = ctx.jsxFactory
  const upperName = name[0].toUpperCase() + name.slice(1)

  return {
    dts: outdent`
    import type { ComponentProps } from "react"
    import type { CssProperties, CssObject } from "../types"
    
    type Element = keyof JSX.IntrinsicElements

    type Merge<P, T> = Omit<P, "color"> & T;
    
    export type HTML${upperName}Props<T extends Element> = Merge<ComponentProps<T>, CssProperties> & { css?: CssObject }

    type JSXFactory = {
      [K in Element]: (props: HTML${upperName}Props<K>) => JSX.Element
    }

    export declare const ${name}: JSXFactory
    `,
    js: outdent`
    import { forwardRef } from 'react'
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
      const PandaComponent = forwardRef((props, ref) => {
        const [styleProps, elementProps] = splitProps(props)
    
        const classes = () => {
          const { css: cssStyles, ...otherStyles } = styleProps
          const atomicClass = css({ ...otherStyles, ...cssStyles })
          return cx(atomicClass, elementProps.className)
        }
    
        return <Dynamic ref={ref} {...elementProps} className={classes()} />
      })
      
      PandaComponent.displayName = \`${name}.\${Dynamic}\`
      return PandaComponent
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

    export const ${name} = createFactory();
    `,
  }
}
