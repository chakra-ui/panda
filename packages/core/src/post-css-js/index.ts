import { objectify } from './objectify'
import { parser } from './parse'
import type { Parser } from 'postcss'

export const postCssJs = {
  parser,
  objectify,
} as {
  parser: Parser
  objectify: typeof objectify
}
