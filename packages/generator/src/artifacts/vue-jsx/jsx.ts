import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generateVueJsxFactory(ctx: Context) {
  const { factoryName, componentName } = ctx.jsx

  return {
    js: outdent`
    import { defineComponent, h, computed } from 'vue'
    ${ctx.file.import(
      'defaultShouldForwardProp, composeShouldForwardProps, composeCvaFn, getDisplayName',
      './factory-helper',
    )}
    ${ctx.file.import('isCssProperty', './is-valid-prop')}
    ${ctx.file.import('css, cx, cva', '../css/index')}
    ${ctx.file.import('splitProps, normalizeHTMLProps', '../helpers')}

    function styledFn(Dynamic, configOrCva = {}, options = {}) {
      const cvaFn = configOrCva.__cva__ || configOrCva.__recipe__ ? configOrCva : cva(configOrCva)
      
      const forwardFn = options.shouldForwardProp || defaultShouldForwardProp
      const shouldForwardProp = (prop) => forwardFn(prop, cvaFn.variantKeys)
      
      const defaultProps = Object.assign(
        options.dataAttr && configOrCva.__name__ ? { 'data-recipe': configOrCva.__name__ } : {},
        options.defaultProps,
      )
        
      const name = (typeof Dynamic === 'string' ? Dynamic : Dynamic.displayName || Dynamic.name) || 'Component'

      const ${componentName} = defineComponent({
        name: \`${factoryName}.\${name}\`,
        inheritAttrs: false,
        props: { as: { type: [String, Object], default: Dynamic.__base__ || Dynamic } },
        setup(props, { slots, attrs }) {
          const __cvaFn__ = composeCvaFn(props.as.__cva__, cvaFn)
          const __shouldForwardProps__ = composeShouldForwardProps(props.as, shouldForwardProp)
          
          const combinedProps = computed(() => Object.assign({}, defaultProps, attrs))
          
          const splittedProps = computed(() => {
            return splitProps(combinedProps.value, shouldForwardProp, __cvaFn__.variantKeys, isCssProperty, normalizeHTMLProps.keys)
          })

          const recipeClass = computed(() => {
            const [_forwardedProps, variantProps, styleProps, _htmlProps, _elementProps] = splittedProps.value
            const { css: cssStyles, ...propStyles } = styleProps
            const compoundVariantStyles = __cvaFn__.__getCompoundVariantCss__?.(variantProps);
            return cx(__cvaFn__(variantProps, false), css(compoundVariantStyles, propStyles, cssStyles), combinedProps.value.className)
          })

          const cvaClass = computed(() => {
            const [_forwardedProps, variantProps, styleProps, _htmlProps, _elementProps] = splittedProps.value
            const { css: cssStyles, ...propStyles } = styleProps
            const cvaStyles = __cvaFn__.raw(variantProps)
            return cx(css(cvaStyles, propStyles, cssStyles), combinedProps.value.className)
          })

          const classes = configOrCva.__recipe__ ? recipeClass : cvaClass

          return () => {
            const [forwardedProps, _variantProps, _styleProps, htmlProps, elementProps] = splittedProps.value
            return h(
              props.as,
              {
                ...forwardedProps,
                ...elementProps,
                ...normalizeHTMLProps(htmlProps),
                class: classes.value,
              },
              slots.default && slots.default(),
            )
          }
        },
      })

      ${componentName}.displayName = \`${factoryName}.\${name}\`
      ${componentName}.__cva__ = cvaFn
      ${componentName}.__base__ = Dynamic
      ${componentName}.__shouldForwardProps__ = shouldForwardProp
      
      return ${componentName}
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
