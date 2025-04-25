import type { Context } from '@pandacss/core'
import { outdent } from 'outdent'

export function generateVueJsxStringLiteralFactory(ctx: Context) {
  const { componentName, factoryName } = ctx.jsx

  return {
    js: outdent`
  import { defineComponent, h, computed } from 'vue'
  ${ctx.file.import('getDisplayName', './factory-helper')}
  ${ctx.file.import('css, cx', '../css/index')}

  function createStyled(Dynamic) {
    const name = getDisplayName(Dynamic)
    const __base__ = Dynamic.__base__ || Dynamic

    function styledFn(template) {
      const styles = css.raw(Dynamic.__styles__, template)
      
      const ${componentName} = defineComponent({
        name: \`${factoryName}.\${name}\`,
        inheritAttrs: false,
        props: {
          modelValue: null,
          as: { type: [String, Object], default: __base__ }
        },
        setup(props, { slots, attrs, emit }) {
          const classes = computed(() => {
            return cx(css(styles), attrs.className)
          })

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
            return h(
              props.as,
              {
                class: classes.value,
                ...attrs,
                ...vModelProps.value,
              },
             slots
            )
          }
        },
      })

      ${componentName}.__styles__ = styles
      ${componentName}.__base__ = __base__

      return ${componentName}
    }

    return styledFn
  }

  const tags = 'a, abbr, address, area, article, aside, audio, b, base, bdi, bdo, big, blockquote, body, br, button, canvas, caption, cite, code, col, colgroup, data, datalist, dd, del, details, dfn, dialog, div, dl, dt, em, embed, fieldset, figcaption, figure, footer, form, h1, h2, h3, h4, h5, h6, head, header, hgroup, hr, html, i, iframe, img, input, ins, kbd, keygen, label, legend, li, link, main, map, mark, marquee, menu, menuitem, meta, meter, nav, noscript, object, ol, optgroup, option, output, p, param, picture, pre, progress, q, rp, rt, ruby, s, samp, script, section, select, small, source, span, strong, style, sub, summary, sup, table, tbody, td, textarea, tfoot, th, thead, time, title, tr, track, u, ul, var, video, wbr, circle, clipPath, defs, ellipse, foreignObject, g, image, line, linearGradient, mask, path, pattern, polygon, polyline, radialGradient, rect, stop, svg, text, tspan';

  export const ${factoryName} = /* @__PURE__ */ createStyled.bind();

  tags.split(', ').forEach((tag) => {
    ${factoryName}[tag] = createStyled(tag);
  });
    `,
  }
}
