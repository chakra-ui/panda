import { logger } from '@pandacss/logger'
import type { ParserMode } from '@pandacss/parser'
import type { ParserResult } from '@pandacss/types'
import { writeFile } from 'fs/promises'
import { Node } from 'ts-morph'
import { classifyTokens } from './classify'
import type { PandaContext } from './create-context'
import { getNodeRange } from './get-node-range'

export function analyzeTokens(
  ctx: PandaContext,
  onResult?: (file: string, result: ParserResult) => void,
  mode: ParserMode = 'internal',
) {
  const done = logger.time.debug(`Analyzed ${ctx.getFiles().length} files`)

  const parserResultByFilepath = new Map<string, ParserResult>()
  ctx
    .getFiles()
    .map((file) => {
      const measure = logger.time.debug(`Extracted ${file}`)
      const result = ctx.project.parseSourceFile(file, ctx.properties, mode)
      measure()

      if (result) {
        parserResultByFilepath.set(file, result)
        onResult?.(file, result)
      }

      return [file, result] as [string, ParserResult]
    })
    .filter(([, result]) => result)

  done()

  return classifyTokens(ctx, parserResultByFilepath)
}

const analyzeResultSerializer = (key: string, value: any) => {
  if (value instanceof Set) {
    return Array.from(value)
  }

  if (value instanceof Map) {
    return Object.fromEntries(value)
  }

  if (Node.isNode(value)) {
    if (key !== 'node') return value.getKindName()
    return { kind: value.getKindName(), range: getNodeRange(value) }
  }

  return value
}

export const writeAnalyzeJSON = (fileName: string, result: ReturnType<typeof analyzeTokens>) => {
  return writeFile(
    fileName,
    JSON.stringify(
      {
        counts: result.counts,
        stats: result.stats,
        byId: result.details.globalMaps.byId,
        byInstanceId: result.details.globalMaps.byInstanceId,
      },
      analyzeResultSerializer,
      4,
    ),
  )
}
