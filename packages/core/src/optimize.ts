import postcss, { Root } from 'postcss'
import nested from 'postcss-nested'
import { optimizePostCss } from './plugins/optimize-postcss'
import prettify from './plugins/prettify'
import sortMediaQueries from './plugins/sort-mq'
import type { LoggerInterface } from '@pandacss/types'

export interface OptimizeOptions {
  minify?: boolean
  lightningcss?: boolean
  browserslist?: string[]
  logger: LoggerInterface
}

export function optimizeCss(code: string | Root, options: OptimizeOptions) {
  const { lightningcss } = options

  if (lightningcss) {
    const light = require('./plugins/optimize-lightningcss') as typeof import('./plugins/optimize-lightningcss')
    return light.default(code, options)
  }

  return optimizePostCss(code, options)
}

export function sortCssMediaQueries(code: string | Root) {
  const { css } = postcss([sortMediaQueries()]).process(code)
  return css
}

export function expandNestedCss(code: string) {
  const { css } = postcss([nested(), prettify()]).process(code)
  return css
}
