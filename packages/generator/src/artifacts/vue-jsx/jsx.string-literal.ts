import { ArtifactFile } from '../artifact'

export const vueJsxStringLiteralFactoryArtifact = new ArtifactFile({
  id: 'jsx/factory.js',
  fileName: 'factory',
  type: 'dts',
  dir: (ctx) => ctx.paths.jsx,
  dependencies: ['jsxFactory'],
  imports: {
    'jsx/factory-helper.js': ['getDisplayName'],
    'css/index.js': ['css', 'cx'],
  },
  computed(ctx) {
    return { jsx: ctx.jsx }
  },
  code(params) {
    const { componentName, factoryName } = params.computed.jsx
    return `import { defineComponent, h, computed } from 'vue'

  function createStyled(Dynamic) {
    const name = getDisplayName(Dynamic)

    function styledFn(template) {
      const styles = css.raw(template)

      const ${componentName} = defineComponent({
        name: \`${factoryName}.\${name}\`,
        inheritAttrs: false,
        props: {
          modelValue: null,
          as: { type: [String, Object], default: Dynamic }
        },
        setup(props, { slots, attrs, emit }) {
          const classes = computed(() => {
            return cx(css(Dynamic.__styles__, styles), elementProps.className)
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
                ...elementProps,
                ...vModelProps.value,
              },
             slots
            )
          }
        },
      })

      ${componentName}.__styles__ = styles
      ${componentName}.__base__ = element

      return ${componentName}
    }
  }

  const tags = 'a, abbr, address, area, article, aside, audio, b, base, bdi, bdo, big, blockquote, body, br, button, canvas, caption, cite, code, col, colgroup, data, datalist, dd, del, details, dfn, dialog, div, dl, dt, em, embed, fieldset, figcaption, figure, footer, form, h1, h2, h3, h4, h5, h6, head, header, hgroup, hr, html, i, iframe, img, input, ins, kbd, keygen, label, legend, li, link, main, map, mark, marquee, menu, menuitem, meta, meter, nav, noscript, object, ol, optgroup, option, output, p, param, picture, pre, progress, q, rp, rt, ruby, s, samp, script, section, select, small, source, span, strong, style, sub, summary, sup, table, tbody, td, textarea, tfoot, th, thead, time, title, tr, track, u, ul, var, video, wbr, circle, clipPath, defs, ellipse, foreignObject, g, image, line, linearGradient, mask, path, pattern, polygon, polyline, radialGradient, rect, stop, svg, text, tspan';

  export const ${factoryName} = /* @__PURE__ */ styledFn.bind();

  tags.split(', ').forEach((tag) => {
    styled[tag] = styled(tag);
  });`
  },
})
