import postcss, { Root } from 'postcss'
import dedupe from 'postcss-discard-duplicates'
import discardEmpty from 'postcss-discard-empty'
import mergeRules from 'postcss-merge-rules'
import minifySelectors from 'postcss-minify-selectors'
import nested from 'postcss-nested'
import normalizeWhiteSpace from 'postcss-normalize-whitespace'
import expandTokenFn from './plugins/expand-token-fn'
import mergeCascadeLayers from './plugins/merge-layers'
import prettify from './plugins/prettify'
import sortCss from './plugins/sort-css'
import sortMediaQueries from './plugins/sort-mq'
import type { Token } from '@pandacss/types'

type OptimizeOptions = {
  minify?: boolean
}

export function optimizeCss(code: string, options: OptimizeOptions = {}) {
  const { minify = false } = options
  const plugins = [
    nested(),
    mergeCascadeLayers(),
    sortMediaQueries(),
    dedupe(),
    mergeRules(),
    sortCss(),
    discardEmpty(),
  ]

  if (minify) {
    plugins.push(normalizeWhiteSpace(), minifySelectors())
  } else {
    plugins.push(prettify())
  }

  const { css } = postcss(plugins).process(code)
  return css
}

export function expandCssFunctions(
  code: string | Root,
  options: { token?: (key: string) => string; raw?: (path: string) => Token | undefined } = {},
) {
  const { token, raw } = options
  const { css } = postcss([expandTokenFn(token, raw)]).process(code)
  return css
}

export function discardDuplicate(code: string | Root, options: OptimizeOptions = {}) {
  const { minify = false } = options
  const plugins = [
    nested(),
    mergeCascadeLayers(),
    sortMediaQueries(),
    dedupe(),
    mergeRules(),
    sortCss(),
    discardEmpty(),
  ]

  if (minify) {
    plugins.push(normalizeWhiteSpace(), minifySelectors())
  } else {
    plugins.push(prettify())
  }

  const { css } = postcss(plugins).process(code)

  return css
}

export function expandNestedCss(code: string) {
  const { css } = postcss([nested(), prettify()]).process(code)
  return css
}

export function prettifyCss(code: string) {
  const { css } = postcss([prettify()]).process(code)
  return css
}
