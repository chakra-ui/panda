import discardDuplicates from 'postcss-discard-duplicates'
// import normalizeWhiteSpace from 'postcss-normalize-whitespace'
// import prettify from 'postcss-prettify'
import postcss from 'postcss'
// import sortMq from 'postcss-sort-media-queries'
import nested from 'postcss-nested'
// import prefixer from 'autoprefixer'
import { mergeLayers } from './plugins/merge-layers'
import { sortMediaQueries } from './plugins/sort-mq'

export function optimizeCss(code: string, { minify = false }: { minify?: boolean } = {}) {
  const { css } = postcss([
    discardDuplicates(),
    mergeLayers(),
    sortMediaQueries(),
    // minify ? normalizeWhiteSpace() : prettify,
    nested(),
    // prefixer(),
  ]).process(code)
  return css
}

export function discardDuplicate(code: string) {
  const { css } = postcss([discardDuplicates()]).process(code)
  return css
}
