import { logger } from '@pandacss/logger'
import type { Token } from '@pandacss/types'
import { Features, transform } from 'lightningcss'
import postcss, { Root } from 'postcss'
import nested from 'postcss-nested'
import expandTokenFn from './plugins/expand-token-fn'

type OptimizeOptions = {
  minify?: boolean
}

export function optimizeCss(code: string | Root, options: OptimizeOptions = {}) {
  const { minify = false } = options

  const codeStr = typeof code === 'string' ? code : code.toString()
  const result = transform({
    code: Buffer.from(codeStr),
    minify,
    sourceMap: false,
    filename: 'styles.css',
    include: Features.Nesting,
    errorRecovery: true,
  })

  if (result.warnings.length) {
    const split = codeStr.split('\n')
    logger.warn(
      'css',
      result.warnings.map((w) => ({ ...w, line: split[w.loc.line - 1] })),
    )
  }

  return result.code.toString()
}

export function expandCssFunctions(
  code: string | Root,
  options: { token?: (key: string) => string; raw?: (path: string) => Token | undefined } = {},
) {
  const { token, raw } = options
  const { css } = postcss([expandTokenFn(token, raw)]).process(code)
  return css
}

export function expandNestedCss(code: string) {
  const { css } = postcss([nested()]).process(code)
  return css
}
