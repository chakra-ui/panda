import { logger } from '@pandacss/logger'
import { Features, transform, browserslistToTargets } from 'lightningcss'
import { Root } from 'postcss'
import browserslist from 'browserslist'

interface OptimizeOptions {
  minify?: boolean
  browserslist?: string[]
}

const decoder = new TextDecoder()

export default function optimizeLightCss(code: string | Root, options: OptimizeOptions = {}) {
  const { minify = false, browserslist: targets } = options

  const codeStr = typeof code === 'string' ? code : code.toString()
  const result = transform({
    code: Buffer.from(codeStr),
    minify,
    sourceMap: false,
    filename: 'styles.css',
    include: Features.Nesting | Features.MediaRangeSyntax,
    targets: browserslistToTargets(browserslist(targets)),
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
