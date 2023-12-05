import { logger } from '@pandacss/logger'
import type { ParserResultType } from '@pandacss/types'
import { filesize } from 'filesize'
import { writeFile } from 'fs/promises'
import zlib from 'zlib'
import { classifyTokens } from './classify'
import type { PandaContext } from './create-context'

const gzipSizeSync = (code: string | Buffer) => zlib.gzipSync(code, { level: zlib.constants.Z_BEST_COMPRESSION }).length

interface Options {
  onResult?: (file: string, result: ParserResultType) => void
}

export function analyzeTokens(ctx: PandaContext, options: Options = {}) {
  const filesMap = new Map<string, ParserResultType>()
  const timesMap = new Map<string, number>()

  const files = ctx.getFiles()
  files.forEach((file) => {
    const start = performance.now()
    const result = ctx.project.parseSourceFile(file)

    const extractMs = performance.now() - start
    timesMap.set(file, extractMs)
    logger.debug('analyze', `Parsed ${file} in ${extractMs}ms`)

    if (result) {
      filesMap.set(file, result)
      options.onResult?.(file, result)
    }
  })

  const totalMs = Array.from(timesMap.values()).reduce((a, b) => a + b, 0)
  logger.debug('analyze', `Analyzed ${files.length} files in ${totalMs.toFixed(2)}ms`)

  const minify = ctx.config.minify

  ctx.config.optimize = true
  ctx.config.minify = false

  // TODO
  const css = ''
  const minifiedCss = ''

  // restore minify config
  ctx.config.minify = minify

  const start = performance.now()
  const analysis = classifyTokens(ctx, filesMap)
  const classifyMs = performance.now() - start

  return Object.assign(
    {
      duration: {
        extractTimeByFiles: Object.fromEntries(timesMap.entries()),
        extractTotal: totalMs,
        classify: classifyMs,
      },
      fileSizes: {
        lineCount: css.split('\n').length,
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

export const writeAnalyzeJSON = (filePath: string, result: ReturnType<typeof analyzeTokens>, ctx: PandaContext) => {
  // prevent writing twice the same BoxNode in the output (already serialized in the `byId` map)
  result.details.byInstanceId.forEach((item) => {
    item.box = item.box.toJSON() as any
  })

  const dirname = ctx.runtime.path.dirname(filePath)
  ctx.runtime.fs.ensureDirSync(dirname)

  return writeFile(
    filePath,
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
