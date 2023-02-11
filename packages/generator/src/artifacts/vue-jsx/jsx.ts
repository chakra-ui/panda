import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generateVueJsxFactory(ctx: Context) {
  const { factoryName } = ctx.jsx

  return {
    js: outdent`
    import { defineComponent, h, computed } from 'vue'
    ${ctx.file.import('css, cx, cva, assignCss', '../css/index')}
    ${ctx.file.import('splitProps, normalizeHTMLProps', '../helpers')}
    ${ctx.file.import('isCssProperty', './is-valid-prop')}
    
    function styled(Dynamic, configOrCva = {}) {
      const cvaFn = configOrCva.__cva__ ? configOrCva : cva(configOrCva)

      return defineComponent({
        name: \`${factoryName}.\${Dynamic}\`,
        inheritAttrs: false,
        props: { as: { type: [String, Object], default: Dynamic } },
        setup(props, { slots, attrs }) {
          const splittedProps = computed(() => {
            return splitProps(attrs, isCssProperty, cvaFn.variants, normalizeHTMLProps.keys)
          })
    
          const classes = computed(() => {
            const [styleProps, variantProps, _htmlProps, elementProps] = splittedProps.value
            const { css: cssStyles, ...propStyles } = styleProps
            const cvaStyles = cvaFn.resolve(variantProps)
            const styles = assignCss(cvaStyles, propStyles, cssStyles)
            return cx(css(styles), elementProps.className)
          })
    
          return () => {
            const [_styleProps, _variantProps, htmlProps, elementProps] = splittedProps.value
            return h(
              props.as,
              {
                class: classes.value,
                ...elementProps,
                ...normalizeHTMLProps(htmlProps),
              },
              slots.default && slots.default(),
            )
          }
        },
      })
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

    export const ${factoryName} = createJsxFactory()

    `,
  }
}
