import postcss from 'postcss'
import postcssNested from 'postcss-nested'
import type { Dict } from './types'
import { postCssJs } from './vendor'

export function toCss(styles: Dict) {
  return postcss([
    postcssNested({
      bubble: ['screen'],
    }),
  ]).process(styles, {
    parser: postCssJs.parser,
  })
}

export function cssToJs(css: string) {
  return postCssJs.objectify(postcss.parse(css))
}
