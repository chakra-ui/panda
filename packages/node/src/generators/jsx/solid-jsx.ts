import { outdent } from 'outdent'
import type { PandaContext } from '../../context'

export function generateSolidJsxFactory(ctx: PandaContext) {
  const name = ctx.jsxFactory
  const upperName = name[0].toUpperCase() + name.slice(1)
  return {
    dts: outdent`
    import type { JSX } from 'solid-js'
    import type { CssProperties, CssObject } from '../types'
    
    type Element = keyof JSX.IntrinsicElements

    type Merge<P, T> = Omit<P, 'color'> & T;
    
    export type HTML${upperName}Props<T extends Element> = Merge<JSX.IntrinsicElements[T], CssProperties> & { css?: CssObject }

    type JSXFactory = {
      [K in Element]: (props: HTML${upperName}Props<K>) => JSX.Element
    }

    export declare const ${name}: JSXFactory
    `,
    js: outdent`
    import { Dynamic } from 'solid-js/web';
    import { mergeProps, splitProps } from 'solid-js';
    import { allCssProperties } from './is-valid-prop'
    import { css } from '../css'

    function cx(...args) {
      return args.filter(Boolean).join(' ')
    }
    
    function styled(element) {
      return function ${upperName}Component(props) {
        const mergedProps = mergeProps({ component: element }, props)
    
        const [localProps, styleProps, elementProps] = splitProps(mergedProps, ['class', 'className'], allCssProperties)
    
        const classes = () => {
          const { css: cssStyles, ...otherStyles } = styleProps
          const atomicClass = css({ ...otherStyles, ...cssStyles })
          return cx(atomicClass, localProps.class, localProps.className)
        }
    
        return <Dynamic {...elementProps} class={classes()} />
      }
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
