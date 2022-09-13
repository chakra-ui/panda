import { outdent } from 'outdent'
import type { Context } from '../create-context'

export function generateJsxFactory(ctx: Context) {
  const name = ctx.jsx?.name ?? 'panda'
  const upperName = name[0].toUpperCase() + name.slice(1)
  return {
    dts: outdent`
    import type { ComponentProps } from "react"
    import type { CssProperties } from "../types"
    
    type Element = keyof JSX.IntrinsicElements

    type Merge<P, T> = Omit<P, "color"> & T;
    
    export type HTML${upperName}Props<T extends Element> = Merge<ComponentProps<T>, CssProperties> & { css?: CssProperties }

    type JSXFactory = {
      [K in Element]: (props: HTML${upperName}Props<K>) => JSX.Element
    }

    export declare const ${name}: JSXFactory
    `,
    js: outdent`
    import { createElement, forwardRef } from "react"
    import { isCssProperty } from "./is-valid-prop"
    import { css } from "../css"

    function splitProps(allProps) {
      const {css, ...props} = allProps
      
      const cssProps = new Map()
      const otherProps = new Map()
      
      for (const [key, value] of Object.entries(props)) {
        if (isCssProperty(key)) {
          cssProps.set(key, value)
        } else {
          otherProps.set(key, value)
        }
      }
      return [{ ...Object.fromEntries(cssProps), ...css }, Object.fromEntries(otherProps)]
    }

    function styled(el) {
      return forwardRef(function PandaComponent(props, ref){
        const [cssProps, otherProps] = splitProps(props)
        const className = [css(cssProps), otherProps.className].filter(Boolean).join(" ")
        return createElement(el, { ...otherProps, className, ref });
      });
    }
    
    function createFactory() {
      const cache = new Map();
    
      return new Proxy(Object.create(null), {
        get(_, el) {
          if (!cache.has(el)) {
            cache.set(el, styled(el));
          }
          return cache.get(el);
        },
      })
    }
      
    export const ${name} = createFactory();
    `,
  }
}
