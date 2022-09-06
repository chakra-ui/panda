import postcss from 'postcss'
import { postcssJs } from './post-css-js'
import postcssNested from 'postcss-nested'
import type { Dict } from './types'

export function toCss(styles: Dict) {
  return postcss([
    postcssNested({
      bubble: ['screen'],
    }),
  ]).process(styles, {
    parser: postcssJs,
  })
}
