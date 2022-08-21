import cssnano from 'cssnano'
import postcss from 'postcss'
//@ts-ignore
import sortMq from 'postcss-sort-media-queries'

export function optimizeCss(code: string, { minify = false }: { minify?: boolean } = {}) {
  const { css } = postcss([
    cssnano({
      preset: [
        'default',
        {
          cssDeclarationSorter: false,
          normalizeWhitespace: minify,
        },
      ],
    }),
    sortMq({ sort: 'mobile-first' }),
  ]).process(code)
  return css
}
