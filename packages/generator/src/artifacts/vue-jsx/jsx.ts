import { outdent } from 'outdent'
import type { Context } from '../../engines'
import { match } from 'ts-pattern'

export function generateVueJsxFactory(ctx: Context) {
  const { factoryName } = ctx.jsx

  return {
    js: outdent`
    import { defineComponent, h, computed } from 'vue'
    ${ctx.file.import('css, cx, cva', '../css/index')}
    ${ctx.file.import('splitProps, normalizeHTMLProps', '../helpers')}
    ${ctx.jsx.styleProps === 'all' ? ctx.file.import('isCssProperty', './is-valid-prop') : ''}

    ${match(ctx.jsx.styleProps)
      .with(
        'all',
        () => outdent`
    const defaultShouldForwardProp = (prop, variantKeys) => !variantKeys.includes(prop) && !isCssProperty(prop)
    `,
      )
      .otherwise(
        () => outdent`
    const defaultShouldForwardProp = (prop, variantKeys) => !variantKeys.includes(prop)
    `,
      )}

    function styledFn(Dynamic, configOrCva = {}, options = {}) {
      const cvaFn = configOrCva.__cva__ || configOrCva.__recipe__ ? configOrCva : cva(configOrCva)
      const name = (typeof Dynamic === 'string' ? Dynamic : Dynamic.displayName || Dynamic.name) || 'Component'

      const forwardFn = options.shouldForwardProp || defaultShouldForwardProp
      const shouldForwardProp = (prop) => forwardFn(prop, cvaFn.variantKeys)
      const initialProps = Object.assign(
        options.dataAttr && configOrCva.__name__ ? { 'data-recipe': configOrCva.__name__ } : {},
        options.defaultProps,
      )

      return defineComponent({
        name: \`${factoryName}.\${name}\`,
        inheritAttrs: false,
        props: { as: { type: [String, Object], default: Dynamic } },
        setup(props, { slots, attrs }) {
          const combinedProps = computed(() => Object.assign({}, initialProps, attrs))
          ${match(ctx.jsx.styleProps)
            .with('all', () => {
              return outdent`
            const splittedProps = computed(() => {
              return splitProps(combinedProps.value, shouldForwardProp, cvaFn.variantKeys, isCssProperty, normalizeHTMLProps.keys)
            })

            const recipeClass = computed(() => {
              const [_forwardedProps, variantProps, styleProps, _htmlProps, _elementProps] = splittedProps.value
              const { css: cssStyles, ...propStyles } = styleProps
              const compoundVariantStyles = cvaFn.__getCompoundVariantCss__?.(variantProps);
              return cx(cvaFn(variantProps, false), css(compoundVariantStyles, propStyles, cssStyles), combinedProps.value.className)
            })

            const cvaClass = computed(() => {
              const [_forwardedProps, variantProps, styleProps, _htmlProps, _elementProps] = splittedProps.value
              const { css: cssStyles, ...propStyles } = styleProps
              const cvaStyles = cvaFn.raw(variantProps)
              return cx(css(cvaStyles, propStyles, cssStyles), combinedProps.value.className)
            })`
            })
            .with('minimal', () => {
              return outdent`
            const splittedProps = computed(() => {
              return splitProps(combinedProps.value, shouldForwardProp, cvaFn.variantKeys, normalizeHTMLProps.keys)
            })

            const recipeClass = computed(() => {
              const [_forwardedProps, variantProps, _htmlProps, _elementProps] = splittedProps.value
              const compoundVariantStyles = cvaFn.__getCompoundVariantCss__?.(variantProps);
              return cx(cvaFn(variantProps, false), css(compoundVariantStyles, combinedProps.css), combinedProps.value.className)
            })

            const cvaClass = computed(() => {
              const [_forwardedProps, variantProps, _htmlProps, _elementProps] = splittedProps.value
              const cvaStyles = cvaFn.raw(variantProps)
              return cx(css(cvaStyles, combinedProps.css), combinedProps.value.className)
            })`
            })
            .with('none', () => {
              return outdent`
            const splittedProps = computed(() => {
              return splitProps(combinedProps.value, shouldForwardProp, cvaFn.variantKeys, isCssProperty, normalizeHTMLProps.keys)
            })

            const recipeClass = computed(() => {
              const [_forwardedProps, variantProps, _htmlProps, _elementProps] = splittedProps.value
              const compoundVariantStyles = cvaFn.__getCompoundVariantCss__?.(variantProps);
              return cx(cvaFn(variantProps, false), css(compoundVariantStyles), combinedProps.value.className)
            })

            const cvaClass = computed(() => {
              const [_forwardedProps, variantProps, _htmlProps, _elementProps] = splittedProps.value
              const cvaStyles = cvaFn.raw(variantProps)
              return cx(css(cvaStyles), combinedProps.value.className)
            })`
            })
            .run()}

          const classes = configOrCva.__recipe__ ? recipeClass : cvaClass

          return () => {
          ${match(ctx.jsx.styleProps)
            .with('all', () => {
              return outdent`
              const [forwardedProps, _variantProps, _styleProps, htmlProps, elementProps] = splittedProps.value
              `
            })
            .otherwise(
              () => outdent`
              const [forwardedProps, _variantProps, htmlProps, elementProps] = splittedProps.value
              `,
            )}


            return h(
              props.as,
              {
                ...forwardedProps.value,
                ...elementProps,
                ...normalizeHTMLProps(htmlProps),
                class: classes.value,
              },
              slots.default && slots.default(),
            )
          }
        },
      })
    }

    function createJsxFactory() {
      return new Proxy(styledFn, {
        apply(_, __, args) {
          return styledFn(...args)
        },
        get(_, el) {
         return styledFn(el)
        },
      })
    }

    export const ${factoryName} = /* @__PURE__ */ createJsxFactory()

    `,
  }
}
