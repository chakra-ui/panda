import discardDuplicates from 'postcss-discard-duplicates'
import normalizeWhiteSpace from 'postcss-normalize-whitespace'
import prettify from 'postcss-prettify'
import postcss from 'postcss'
import sortMq from 'postcss-sort-media-queries'
import nested from 'postcss-nested'
import prefixer from 'autoprefixer'

export function optimizeCss(code: string, { minify = false }: { minify?: boolean } = {}) {
  const { css } = postcss([
    discardDuplicates(),
    sortMq({ sort: 'mobile-first' }),
    minify ? normalizeWhiteSpace() : prettify,
    nested(),
    prefixer(),
  ]).process(code)
  return css
}

export function discardDuplicate(code: string) {
  const { css } = postcss([discardDuplicates()]).process(code)
  return css
}
