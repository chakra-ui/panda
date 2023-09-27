import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generateQwikJsxStringLiteralFactory(ctx: Context) {
  const { factoryName, componentName } = ctx.jsx

  return {
    js: outdent`
    import { h } from '@builder.io/qwik'
    ${ctx.file.import('css, cx', '../css/index')}

    function createStyledFn(Dynamic) {
      return function styledFn(template) {
          const baseClassName = css(template)
          const ${componentName} = function ${componentName}(props) {
              const { as: Element = Dynamic, ...elementProps } = props
              const classes = () => cx(baseClassName, elementProps.className)

              return h(Element, {
                  ...elementProps,
                  className: classes(),
              })
          }

          const name = (typeof Dynamic === 'string' ? Dynamic : Dynamic.displayName || Dynamic.name) || 'Component'
          ${componentName}.displayName = \`${factoryName}.\${name}\`
          return ${componentName}
        }
    }

    function createJsxFactory() {
      const cache = new Map()

      return new Proxy(createStyledFn, {
        apply(_, __, args) {
          return createStyledFn(...args)
        },
        get(_, el) {
          if (!cache.has(el)) {
            cache.set(el, createStyledFn(el))
          }
          return cache.get(el)
        },
      })
    }

    export const ${factoryName} = /* @__PURE__ */ createJsxFactory()

    `,
  }
}
