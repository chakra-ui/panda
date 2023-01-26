import postcss, { Root } from 'postcss'
import dedupe from 'postcss-discard-duplicates'
import discardEmpty from 'postcss-discard-empty'
import mergeRules from 'postcss-merge-rules'
import nested from 'postcss-nested'
import normalizeWhiteSpace from 'postcss-normalize-whitespace'
import mergeCascadeLayers from './plugins/merge-layers'
import prettify from './plugins/prettify'
import sortCss from './plugins/sort-css'
import sortMediaQueries from './plugins/sort-mq'

export function optimizeCss(code: string, { minify = false }: { minify?: boolean } = {}) {
  const { css } = postcss([
    nested(),
    mergeCascadeLayers(),
    sortMediaQueries(),
    dedupe(),
    mergeRules(),
    sortCss(),
    discardEmpty(),
    minify ? normalizeWhiteSpace() : prettify(),
  ]).process(code)

  return css
}

export function discardDuplicate(code: string | Root) {
  const { css } = postcss([mergeCascadeLayers(), dedupe(), sortMediaQueries(), sortCss(), prettify()]).process(code)
  return css
}

export function expandNestedCss(code: string) {
  const { css } = postcss([nested(), prettify()]).process(code)
  return css
}

export function prettifyCss(code: string) {
  const { css } = postcss([prettify()]).process(code)
  return css
}
