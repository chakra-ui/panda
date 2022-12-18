import postcss from 'postcss'
import dedupe from 'postcss-discard-duplicates'
import nested from 'postcss-nested'
import normalizeWhiteSpace from 'postcss-normalize-whitespace'
import mergeCascadeLayers from './plugins/merge-layers'
import sortMediaQueries from './plugins/sort-mq'
import prettify from './plugins/prettify'

export function optimizeCss(code: string, { minify = false }: { minify?: boolean } = {}) {
  const { css } = postcss([
    nested(),
    mergeCascadeLayers(),
    sortMediaQueries(),
    dedupe(),
    minify ? normalizeWhiteSpace() : prettify(),
  ]).process(code)

  return css
}

export function discardDuplicate(code: string) {
  const { css } = postcss([mergeCascadeLayers(), dedupe()]).process(code)
  return css
}

export function prettifyCss(code: string) {
  const { css } = postcss([prettify()]).process(code)
  return css
}
