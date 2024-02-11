import postcss, { Root } from 'postcss'
import nested from 'postcss-nested'
import { optimizePostCss } from './plugins/optimize-postcss'
import prettify from './plugins/prettify'

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

export function expandNestedCss(code: string) {
  const { css } = postcss([nested(), prettify()]).process(code)
  return css
}
