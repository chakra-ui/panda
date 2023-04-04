import type { Dict } from '@pandacss/types'
import postcss from 'postcss'
import postcssNested from 'postcss-nested'
import { safeParse } from './safe-parse'
import { postCssJs } from './vendor'

export function toCss(styles: Dict, { important }: { important?: boolean } = {}) {
  const result = postcss([
    postcssNested({
      bubble: ['breakpoint'],
    }),
  ]).process(styles, {
    parser: postCssJs.parser,
  })

  if (important) {
    result.root.walkDecls((decl) => {
      decl.important = true
    })
  }

  return result
}

export function cssToJs(css: string) {
  return postCssJs.objectify(safeParse(css))
}

export function addImportant(css: Record<string, any>): Record<string, any> {
  const result = postcss().process(css, {
    parser: postCssJs.parser,
  })

  result.root.walkDecls((decl) => {
    decl.important = true
  })

  return cssToJs(result.css)
}
