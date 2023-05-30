import { logger } from '@pandacss/logger'
import type { ParserResultType } from '@pandacss/types'
import { writeFile } from 'fs/promises'
import { classifyTokens } from './classify'
import type { PandaContext } from './create-context'

import { filesize } from 'filesize'
import { gzipSizeSync } from 'gzip-size'

export function analyzeTokens(
  ctx: PandaContext,
  options: { onResult?: (file: string, result: ParserResultType) => void } = {},
) {
  const parserResultByFilepath = new Map<string, ParserResultType>()
  const extractTimeByFilepath = new Map<string, number>()

  const includedFiles = ctx.getFiles()
  includedFiles.forEach((file) => {
    const start = performance.now()
    const result = ctx.project.parseSourceFile(file)

    const extractMs = performance.now() - start
    extractTimeByFilepath.set(file, extractMs)
    logger.debug('analyze', `Parsed ${file} in ${extractMs}ms`)

    if (result) {
      parserResultByFilepath.set(file, result)
      options.onResult?.(file, result)
    }
  })

  const totalMs = Array.from(extractTimeByFilepath.values()).reduce((a, b) => a + b, 0)
  logger.debug('analyze', `Analyzed ${includedFiles.length} files in ${totalMs.toFixed(2)}ms`)

  const minify = ctx.config.minify
  const chunkFiles = ctx.chunks.getFiles()

  ctx.config.optimize = true
  ctx.config.minify = false
  const css = ctx.getCss({ files: chunkFiles })

  ctx.config.minify = true
  const minifiedCss = ctx.getCss({ files: chunkFiles })

  // restore minify config
  ctx.config.minify = minify

  const start = performance.now()
  const analysis = classifyTokens(ctx, parserResultByFilepath)
  const classifyMs = performance.now() - start

  return Object.assign(
    {
      duration: {
        extractTimeByFiles: Object.fromEntries(extractTimeByFilepath.entries()),
        extractTotal: totalMs,
        classify: classifyMs,
      },
      fileSizes: {
        lineCount: css.split('\n').length,
        // rulesCount: css.split('{').length - 1, ?
        normal: filesize(Buffer.byteLength(css, 'utf-8')),
        minified: filesize(Buffer.byteLength(minifiedCss, 'utf-8')),
        gzip: {
          normal: filesize(gzipSizeSync(css)),
          minified: filesize(gzipSizeSync(minifiedCss)),
        },
      },
    },
    analysis,
  )
}

const analyzeResultSerializer = (_key: string, value: any) => {
  if (value instanceof Set) {
    return Array.from(value)
  }

  if (value instanceof Map) {
    return Object.fromEntries(value)
  }

  return value
}

export const writeAnalyzeJSON = (fileName: string, result: ReturnType<typeof analyzeTokens>, ctx: PandaContext) => {
  // prevent writing twice the same BoxNode in the output (already serialized in the `byId` map)
  result.details.byInstanceId.forEach((item) => {
    item.box = item.box.toJSON() as any
  })

  return writeFile(
    fileName,
    JSON.stringify(
      Object.assign(result, {
        cwd: ctx.config.cwd,
        theme: ctx.config.theme,
        utilities: ctx.config.utilities,
        conditions: ctx.config.conditions,
        shorthands: ctx.utility.shorthands,
        parserOptions: ctx.parserOptions,
      }),
      analyzeResultSerializer,
      2,
    ),
  )
}
