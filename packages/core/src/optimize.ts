import normalizeWhiteSpace from 'postcss-normalize-whitespace'
import postcss, { AcceptedPlugin } from 'postcss'
import nested from 'postcss-nested'
// import prefixer from 'autoprefixer'
import { mergeLayers } from './plugins/merge-layers'
import { sortMediaQueries } from './plugins/sort-mq'
import dudupe from './plugins/dudupe'

export function optimizeCss(code: string, { minify = false }: { minify?: boolean } = {}) {
  const { css } = postcss(
    [
      mergeLayers(),
      sortMediaQueries(),
      dudupe(),
      nested(),
      minify && normalizeWhiteSpace(),
      // prefixer(),
    ].filter(Boolean) as AcceptedPlugin[],
  ).process(code)

  return css
}

export function discardDuplicate(code: string) {
  const { css } = postcss([mergeLayers(), dudupe()]).process(code)
  return css
}
