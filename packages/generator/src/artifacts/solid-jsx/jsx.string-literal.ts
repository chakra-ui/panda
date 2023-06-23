import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generateSolidJsxStringLiteralFactory(ctx: Context) {
  const { componentName, factoryName } = ctx.jsx
  return {
    js: outdent`
import { mergeProps, splitProps } from 'solid-js'
import { Dynamic, createComponent } from 'solid-js/web'
${ctx.file.import('css, cx', '../css/index')}

function createStyled(element) {
  return function styledFn(template) {
    const baseClassName = css(template)
    return function ${componentName}(props) {
      const mergedProps = mergeProps({ as: element }, props)
      const [localProps, elementProps] = splitProps(mergedProps, ['as', 'class'])
      
      return createComponent(
        Dynamic,
        mergeProps(
          {
            get component() {
              return localProps.as
            },
            get class() {
              return cx(baseClassName, localProps.class)
            },
          },
          elementProps,
        ),
      )
    }
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

export const ${factoryName} = createJsxFactory()
    `,
  }
}
