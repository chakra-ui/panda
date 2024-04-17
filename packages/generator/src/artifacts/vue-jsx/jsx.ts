import type { Context } from '@pandacss/core'
import { outdent } from 'outdent'

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

      const name = getDisplayName(Dynamic)
      const __cvaFn__ = composeCvaFn(Dynamic.__cva__, cvaFn)
      const __shouldForwardProps__ = composeShouldForwardProps(Dynamic, shouldForwardProp)

      const ${componentName} = defineComponent({
        name: \`${factoryName}.\${name}\`,
        inheritAttrs: false,
        props: {
          modelValue: null,
          as: { type: [String, Object], default: Dynamic.__base__ || Dynamic }
        },
        setup(props, { slots, attrs, emit }) {
          const combinedProps = computed(() => Object.assign({}, defaultProps, attrs))

          const splittedProps = computed(() => {
            return splitProps(combinedProps.value, normalizeHTMLProps.keys, __shouldForwardProps__, __cvaFn__.variantKeys, isCssProperty)
          })

          const recipeClass = computed(() => {
            const [_htmlProps, _forwardedProps, variantProps, styleProps, _elementProps] = splittedProps.value
            const { css: cssStyles, ...propStyles } = styleProps
            const compoundVariantStyles = __cvaFn__.__getCompoundVariantCss__?.(variantProps);
            return cx(__cvaFn__(variantProps, false), css(compoundVariantStyles, propStyles, ...(Array.isArray(cssStyles) ? cssStyles : [cssStyles])), combinedProps.value.className, combinedProps.value.class)
          })

          const cvaClass = computed(() => {
            const [_htmlProps, _forwardedProps, variantProps, styleProps, _elementProps] = splittedProps.value
            const { css: cssStyles, ...propStyles } = styleProps
            const cvaStyles = __cvaFn__.raw(variantProps)
            return cx(css(cvaStyles, propStyles, ...(Array.isArray(cssStyles) ? cssStyles : [cssStyles])), combinedProps.value.className, combinedProps.value.class)
          })

          const classes = configOrCva.__recipe__ ? recipeClass : cvaClass

          const vModelProps = computed(() => {
            const result = {};

            if (
              props.as === 'input' &&
              (props.type === 'checkbox' || props.type === 'radio')
            ) {
              result.checked = props.modelValue;
              result.onChange = (event) => {
                const checked = !event.currentTarget.checked;
                emit('change', checked, event);
                emit('update:modelValue', checked, event);
              };
            } else if (
              props.as === 'input' ||
              props.as === 'textarea' ||
              props.as === 'select'
            ) {
              result.value = props.modelValue;
              result.onInput = (event) => {
                const value = event.currentTarget.value;
                emit('input', value, event);
                emit('update:modelValue', value, event);
              };
            }

            return result;
          });

          return () => {
            const [htmlProps, forwardedProps, _variantProps, _styleProps, elementProps] = splittedProps.value

            return h(
              props.as,
              {
                ...forwardedProps,
                ...elementProps,
                ...normalizeHTMLProps(htmlProps),
                ...vModelProps.value,
                class: classes.value,
              },
              slots,
            )
          }
        },
      })

      ${componentName}.displayName = \`${factoryName}.\${name}\`
      ${componentName}.__cva__ = __cvaFn__
      ${componentName}.__base__ = Dynamic
      ${componentName}.__shouldForwardProps__ = shouldForwardProp

      return ${componentName}
    }

    const tags = 'a, abbr, address, area, article, aside, audio, b, base, bdi, bdo, big, blockquote, body, br, button, canvas, caption, cite, code, col, colgroup, data, datalist, dd, del, details, dfn, dialog, div, dl, dt, em, embed, fieldset, figcaption, figure, footer, form, h1, h2, h3, h4, h5, h6, head, header, hgroup, hr, html, i, iframe, img, input, ins, kbd, keygen, label, legend, li, link, main, map, mark, marquee, menu, menuitem, meta, meter, nav, noscript, object, ol, optgroup, option, output, p, param, picture, pre, progress, q, rp, rt, ruby, s, samp, script, section, select, small, source, span, strong, style, sub, summary, sup, table, tbody, td, textarea, tfoot, th, thead, time, title, tr, track, u, ul, var, video, wbr, circle, clipPath, defs, ellipse, foreignObject, g, image, line, linearGradient, mask, path, pattern, polygon, polyline, radialGradient, rect, stop, svg, text, tspan';

    export const ${factoryName} = /* @__PURE__ */ styledFn.bind();

    tags.split(', ').forEach((tag) => {
      styled[tag] = styled(tag);
    });
    `,
  }
}
