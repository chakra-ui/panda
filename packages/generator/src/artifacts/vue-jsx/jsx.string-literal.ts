import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generateVueJsxStringLiteralFactory(ctx: Context) {
  const { factoryName } = ctx.jsx

  return {
    js: outdent`
    import { defineComponent, h, computed } from 'vue'
    ${ctx.file.import('css, cx', '../css/index')}

  function createStyled(Dynamic) {
    function styledFn(template) {
      const baseClassName = css(template)
      return defineComponent({
        name: \`${factoryName}.\${Dynamic}\`,
        inheritAttrs: false,
        props: { as: { type: [String, Object], default: Dynamic } },
        setup(props, { slots, attrs }) {
          const classes = computed(() => cx(baseClassName, elementProps.className))
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
