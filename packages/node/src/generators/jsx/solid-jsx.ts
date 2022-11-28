import { capitalize } from '@pandacss/shared'
import { outdent } from 'outdent'
import type { PandaContext } from '../../context'

export function generateSolidJsxFactory(ctx: PandaContext) {
  const name = ctx.jsxFactory
  const upperName = capitalize(name)
  return {
    dts: outdent`
    import type { JSX } from 'solid-js'
    import type { JSXStyleProperties, Assign} from '../types'
    
    type Element = keyof JSX.IntrinsicElements
    
    export type HTML${upperName}Props<T extends Element> = Omit<JSX.IntrinsicElements[T], 'color'> | JSXStyleProperties

    type JSXFactory = {
      [K in Element]: (props: HTML${upperName}Props<K>) => JSX.Element
    }

    export declare const ${name}: JSXFactory
    `,
    js: outdent`
    import { Dynamic } from 'solid-js/web'
    import { mergeProps, splitProps } from 'solid-js'
    import { allCssProperties } from './is-valid-prop'
    import { css } from '../css'

    function cx(...args) {
      return args.filter(Boolean).join(' ')
    }
    
    function styled(element) {
      return function ${upperName}Component(props) {
        const mergedProps = mergeProps({ as: element }, props)
    
        const [localProps, styleProps, elementProps] = splitProps(
          mergedProps,
          ['as', 'class', 'className'],
          allCssProperties
        )
    
        const classes = () => {
          const { css: cssStyles, ...otherStyles } = styleProps
          const atomicClass = css({ ...otherStyles, ...cssStyles })
          return cx(atomicClass, localProps.class, localProps.className)
        }
    
        return <Dynamic component={localProps.as} {...elementProps} class={classes()} />
      }
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
