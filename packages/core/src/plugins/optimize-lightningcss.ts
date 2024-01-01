import { logger } from '@pandacss/logger'
import { Features, transform } from 'lightningcss'
import { Root } from 'postcss'

interface OptimizeOptions {
  minify?: boolean
}

const decoder = new TextDecoder()

export default function optimizeLightCss(code: string | Root, options: OptimizeOptions = {}) {
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

  return decoder.decode(result.code)
}
