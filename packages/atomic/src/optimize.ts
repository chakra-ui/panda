import cssnano, { Options } from 'cssnano'
import postcss from 'postcss'

const defaultOptions: Options = {
  preset: ['default', { cssDeclarationSorter: false }],
}

export function optimizeCss(code: string) {
  return postcss([cssnano(defaultOptions)]).process(code)
}
