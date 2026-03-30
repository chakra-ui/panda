import type { PandaHooks } from '@pandacss/types'
import postcss, { Root } from 'postcss'
import nested from 'postcss-nested'
import { optimizePostCss } from './plugins/optimize-postcss'
import prettify from './plugins/prettify'

interface OptimizeOptions {
  minify?: boolean
  browserslist?: string[]
  hooks?: Partial<PandaHooks>
}

export function optimizeCss(code: string | Root, options: OptimizeOptions = {}) {
  const { hooks } = options
  const css = typeof code === 'string' ? code : code.toString()

  if (hooks?.['css:optimize']) {
    const result = hooks['css:optimize']({
      css,
      minify: options.minify,
      browserslist: options.browserslist,
    })
    if (result !== undefined) {
      return result
    }
  }

  return optimizePostCss(code, options)
}

export function expandNestedCss(code: string) {
  const { css } = postcss([nested(), prettify()]).process(code)
  return css
}
