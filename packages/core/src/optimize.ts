import postcss from 'postcss'
import dedupe from 'postcss-discard-duplicates'
import nested from 'postcss-nested'
import normalizeWhiteSpace from 'postcss-normalize-whitespace'
import { mergeLayers } from './plugins/merge-layers'
import { sortMediaQueries } from './plugins/sort-mq'
import { prettify } from './plugins/prettify'

export function optimizeCss(code: string, { minify = false }: { minify?: boolean } = {}) {
  const { css } = postcss([
    mergeLayers(),
    sortMediaQueries(),
    dedupe(),
    nested(),
    minify ? normalizeWhiteSpace() : prettify(),
  ]).process(code)

  return css
}

export function discardDuplicate(code: string) {
  const { css } = postcss([mergeLayers(), dedupe()]).process(code)
  return css
}
