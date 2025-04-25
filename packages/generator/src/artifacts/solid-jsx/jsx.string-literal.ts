import type { Context } from '@pandacss/core'
import { outdent } from 'outdent'

export function generateSolidJsxStringLiteralFactory(ctx: Context) {
  const { componentName, factoryName } = ctx.jsx
  return {
    js: outdent`
import { mergeProps, splitProps } from 'solid-js'
import { Dynamic, createComponent } from 'solid-js/web'
${ctx.file.import('getDisplayName', './factory-helper')}
${ctx.file.import('css, cx', '../css/index')}

function createStyled(element) {
  const __base__ = element.__base__ || element
  return function styledFn(template) {
    const styles = css.raw(element.__styles__, template)

    const ${componentName} = (props) => {
      const mergedProps = mergeProps({ as: __base__ }, props)
      const [localProps, elementProps] = splitProps(mergedProps, ['as', 'class'])
      
      return createComponent(
        Dynamic,
        mergeProps(
          {
            get component() {
              return localProps.as
            },
            get class() {
              return cx(css(styles), localProps.class)
            },
          },
          elementProps,
        ),
      )
    }

    const name = getDisplayName(__base__)

    ${componentName}.displayName = \`${factoryName}.\${name}\`
    ${componentName}.__styles__ = styles
    ${componentName}.__base__ = __base__

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
