import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generateVueJsxStringLiteralFactory(ctx: Context) {
  const { componentName, factoryName } = ctx.jsx

  return {
    js: outdent`
    import { defineComponent, h, computed } from 'vue'
    ${ctx.file.import('getDisplayName', './factory-helper')}
    ${ctx.file.import('css, cx', '../css/index')}

  function createStyled(Dynamic) {
    const name = getDisplayName(Dynamic)

    function styledFn(template) {
      const styles = css.raw(template)
      
      const ${componentName} = defineComponent({
        name: \`${factoryName}.\${name}\`,
        inheritAttrs: false,
        props: { as: { type: [String, Object], default: Dynamic } },
        setup(props, { slots, attrs }) {
          const classes = computed(() => {
            return cx(css(Dynamic.__styles__, styles), elementProps.className)
          })
          
          return () => {
            return h(
              props.as,
              {
                class: classes.value,
                ...elementProps,
              },
              slots.default && slots.default(),
            )
          }
        },
      })

      ${componentName}.__styles__ = styles
      ${componentName}.__base__ = element

      return ${componentName}
    }
  }

    function createJsxFactory() {
      const cache = new Map()

      return new Proxy(createStyled, {
        apply(_, __, args) {
          return createStyled(...args)
        },
        get(_, el) {
          if (!cache.has(el)) {
            cache.set(el, createStyled(el))
          }
          return cache.get(el)
        },
      })
    }

    export const ${factoryName} = /* @__PURE__ */ createJsxFactory()
    `,
  }
}
