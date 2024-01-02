import type { Dict } from '@pandacss/types'
import { postCssJs } from './post-css-js'
import { safeParse } from './safe-parse'
import { stringify } from './stringify'

export function toCss(styles: Dict) {
  return stringify(styles)
}

export function cssToJs(css: string) {
  return postCssJs.objectify(safeParse(css))
}
