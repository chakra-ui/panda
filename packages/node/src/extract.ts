import { logger } from '@pandacss/logger'
import type { ParserResult } from '@pandacss/parser'
import type { PandaContext } from './create-context'

export function extractFile(ctx: PandaContext, relativeFile: string) {
  const file = ctx.runtime.path.abs(ctx.config.cwd, relativeFile)
  logger.debug('file:extract', file)

  const measure = logger.time.debug(`Parsed ${file}`)
  let result: ParserResult | undefined

  try {
    result = ctx.project.parseSourceFile(file)
  } catch (error) {
    logger.error('file:extract', error)
  }

  measure()
  return result
}
export type CssArtifactType = 'preflight' | 'tokens' | 'static' | 'global' | 'keyframes'
