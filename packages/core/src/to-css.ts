import type { Dict } from '@pandacss/types'
import { stringify } from './stringify'

export function toCss(styles: Dict) {
  return stringify(styles)
}
