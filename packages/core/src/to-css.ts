import type { Dict } from '@pandacss/types'
import postcss from 'postcss'
import postcssNested from 'postcss-nested'
import { postCssJs } from './post-css-js'
import { safeParse } from './safe-parse'

export function toCss(styles: Dict, { important }: { important?: boolean } = {}) {
  const result = postcss([
    // TODO rm ou swap à lightning ?
    postcssNested({
      bubble: ['breakpoint'],
    }),
  ]).process(styles, {
    parser: postCssJs.parser,
  })

  // TODO rm
  if (important) {
    result.root.walkDecls((decl) => {
      decl.important = true
    })
  }

  return result as postcss.LazyResult
}

export function cssToJs(css: string) {
  return postCssJs.objectify(safeParse(css))
}
