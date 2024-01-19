import type { Token } from '@pandacss/types'
import postcss, { Root } from 'postcss'
import nested from 'postcss-nested'
import expandTokenFn from './plugins/expand-token-fn'
import prettify from './plugins/prettify'
import { optimizePostCss } from './plugins/optimize-postcss'
import sortMediaQueries from './plugins/sort-mq'

interface OptimizeOptions {
  minify?: boolean
  lightningcss?: boolean
  browserslist?: string[]
}

export function optimizeCss(code: string | Root, options: OptimizeOptions = {}) {
  const { lightningcss } = options

  if (lightningcss) {
    const light = require('./plugins/optimize-lightningcss') as typeof import('./plugins/optimize-lightningcss')
    return light.default(code, options)
  }

  return optimizePostCss(code, options)
}

export function expandCssFunctions(
  code: string | Root,
  options: { token?: (key: string) => string; raw?: (path: string) => Token | undefined } = {},
) {
  const { token, raw } = options
  const { css } = postcss([expandTokenFn(token, raw), sortMediaQueries()]).process(code)
  return css
}

export function expandNestedCss(code: string) {
  const { css } = postcss([nested(), prettify()]).process(code)
  return css
}
