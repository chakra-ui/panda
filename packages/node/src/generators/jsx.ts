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

    type JSXFactory = {
      [K in Element]: (props: Merge<ComponentProps<K>, CssProperties>) => JSX.Element
    }

    export type HTML${upperName}Props<T extends Element> = Merge<ComponentProps<T>, CssProperties>

    export declare const ${name}: JSXFactory
    `,
    js: outdent`
    import { createElement, forwardRef } from "react"
    import { isValidProp } from "./is-valid-prop"

    function styled(el) {
      return forwardRef((props, ref) => {
        const ownProps = Object.entries(props).reduce((acc, [key, value]) => {
          if (isValidProp(key)) acc[key] = value;
          return acc;
        }, {});

        return createElement(el, { ...ownProps, ref });
      });
    }
    
    function createFactory() {
      const cache = new Map();
    
      return new Proxy(Object.create(null), {
        get(_, el) {
          if (!cache.has(el)) {
            cache.set(el, styled(el));
          }
          return cache.get(element);
        },
      })
    }
      
    export const ${name} = createFactory();
    `,
  }
}
