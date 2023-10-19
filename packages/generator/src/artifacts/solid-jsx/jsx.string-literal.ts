import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generateSolidJsxStringLiteralFactory(ctx: Context) {
  const { componentName, factoryName } = ctx.jsx
  return {
    js: outdent`
import { mergeProps, splitProps } from 'solid-js'
import { Dynamic, createComponent } from 'solid-js/web'
${ctx.file.import('getDisplayName', './factory-helper')}
${ctx.file.import('css, cx', '../css/index')}

function createStyled(element) {
  return function styledFn(template) {
    const styles = css.raw(template)

    const ${componentName} = (props) => {
      const mergedProps = mergeProps({ as: element.__base__ || element }, props)
      const [localProps, elementProps] = splitProps(mergedProps, ['as', 'class'])
      
      return createComponent(
        Dynamic,
        mergeProps(
          {
            get component() {
              return localProps.as
            },
            get class() {
              return cx(css(Dynamic.__styles__, styles), localProps.class)
            },
          },
          elementProps,
        ),
      )
    }

    const name = getDisplayName(Dynamic)

    ${componentName}.displayName = \`${factoryName}.\${name}\`
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
