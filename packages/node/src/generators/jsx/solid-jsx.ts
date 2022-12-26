import { capitalize } from '@pandacss/shared'
import { outdent } from 'outdent'
import type { PandaContext } from '../../context'

export function generateSolidJsxFactory(ctx: PandaContext) {
  const name = ctx.jsxFactory
  const upperName = capitalize(name)
  return {
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
