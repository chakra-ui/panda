import postcss, { Container } from 'postcss'
import dedupe from 'postcss-discard-duplicates'
import discardEmpty from 'postcss-discard-empty'
import minifySelectors from 'postcss-minify-selectors'
import nested from 'postcss-nested'
import normalizeWhiteSpace from 'postcss-normalize-whitespace'
import { mergeRules } from './merge-rules'
import prettify from './prettify'

interface OptimizeOptions {
  minify?: boolean
}

export function optimizePostCss(code: string | Container, options: OptimizeOptions = {}) {
  const { minify = false } = options

  // prettier-ignore
  const plugins = [
    nested(),
    dedupe(),
    mergeRules(),
    discardEmpty(),
  ]

  if (minify) {
    plugins.push(normalizeWhiteSpace(), minifySelectors())
  } else {
    plugins.push(prettify() as any)
  }

  const { css } = postcss(plugins).process(code)
  return css
}
