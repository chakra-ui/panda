import postcss from 'postcss'
import postcssNested from 'postcss-nested'
import type { Dict } from './types'
import { postCssJs } from './vendor'

export function toCss(styles: Dict, { important }: { important?: boolean } = {}) {
  const result = postcss([
    postcssNested({
      bubble: ['screen'],
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
  return postCssJs.objectify(postcss.parse(css))
}
