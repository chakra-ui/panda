import { logger } from '@pandacss/logger'
import type { ParserResult } from '@pandacss/parser'
import type { PandaContext } from './create-context'

/**
 * Parse a file and return the corresponding css
 */
export function extractFile(ctx: PandaContext, filePath: string) {
  const file = ctx.runtime.path.abs(ctx.config.cwd, filePath)
  logger.debug('file:extract', file)

  const measure = logger.time.debug(`Extracted ${file}`)

  let result: ParserResult | undefined

  try {
    result = ctx.project.parseSourceFile(file)
  } catch (error) {
    logger.error('file:parse', error)
  }

  ctx.appendParserCss(result)

  measure()

  return result
}

export type CssArtifactType = 'preflight' | 'tokens' | 'static' | 'global' | 'keyframes'
