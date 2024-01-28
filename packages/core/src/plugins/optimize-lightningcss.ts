import browserslist from 'browserslist'
import { Features, browserslistToTargets, transform } from 'lightningcss'
import { Root } from 'postcss'
import type { OptimizeOptions } from '../optimize'

const decoder = new TextDecoder()

export default function optimizeLightCss(code: string | Root, options: OptimizeOptions) {
  const { minify = false, browserslist: targets, logger } = options

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
