import type { Dict } from '@pandacss/types'
import postcss from 'postcss'
import postcssNested from 'postcss-nested'
import { postCssJs } from './post-css-js'
import { safeParse } from './safe-parse'

export function toCss(styles: Dict) {
  const result = postcss([postcssNested()]).process(styles, {
    parser: postCssJs.parser,
  })

  return result as postcss.LazyResult
}

export function cssToJs(css: string) {
  return postCssJs.objectify(safeParse(css))
}
