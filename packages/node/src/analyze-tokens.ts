import { logger } from '@pandacss/logger'
import type { ParserResultInterface, ReportSnapshot, ReportSnapshotJSON } from '@pandacss/types'
import { filesize } from 'filesize'
import { writeFile } from 'fs/promises'
import path from 'node:path'
import zlib from 'zlib'
import { classifyTokens } from './classify'
import type { PandaContext } from './create-context'
import { version } from '../package.json'

const gzipSizeSync = (code: string | Buffer) => zlib.gzipSync(code, { level: zlib.constants.Z_BEST_COMPRESSION }).length

interface Options {
  onResult?: (file: string, result: ParserResultInterface) => void
}

export function analyzeTokens(ctx: PandaContext, options: Options = {}): ReportSnapshot {
  const filesMap = new Map<string, ParserResultInterface>()
  const timesMap = new Map<string, number>()

  const files = ctx.getFiles()
  const sheet = ctx.createSheet()
  ctx.appendLayerParams(sheet)
  ctx.appendBaselineCss(sheet)

  files.forEach((file) => {
    const start = performance.now()
    const result = ctx.project.parseSourceFile(file)

    const extractMs = performance.now() - start
    const relativePath = path.relative(ctx.config.cwd, file)
    timesMap.set(relativePath, extractMs)
    logger.debug('analyze', `Parsed ${file} in ${extractMs}ms`)

    if (result) {
      filesMap.set(relativePath, result)
      options.onResult?.(file, result)
    }
  })

  const totalMs = Array.from(timesMap.values()).reduce((a, b) => a + b, 0)
  logger.debug('analyze', `Analyzed ${files.length} files in ${totalMs.toFixed(2)}ms`)

  ctx.appendParserCss(sheet)

  const cssStart = performance.now()
  ctx.config.minify = false
  const css = ctx.getCss(sheet)
  const cssMs = performance.now() - cssStart

  const cssMinifyStart = performance.now()
  ctx.config.minify = true
  const minifiedCss = ctx.getCss(sheet)
  const cssMinifyMs = performance.now() - cssMinifyStart

  let lightningCss = ''
  let lightningCssMs: number | undefined
  let lightningCssMinifiedCss = ''
  let lightningCssMinifiedMs: number | undefined

  const isUsingLightningCss = ctx.config.lightningcss
  if (!isUsingLightningCss) {
    sheet['context'].lightningcss = true

    ctx.config.minify = false
    const lightningcssStart = performance.now()
    lightningCss = ctx.getCss(sheet)
    lightningCssMs = performance.now() - lightningcssStart

    ctx.config.minify = true
    const lightningcssMinifyStart = performance.now()
    lightningCssMinifiedCss = ctx.getCss(sheet)
    lightningCssMinifiedMs = performance.now() - lightningcssMinifyStart
  }

  const start = performance.now()
  const analysis = classifyTokens(ctx, filesMap)
  const classifyMs = performance.now() - start

  const details = Object.assign(
    {
      duration: {
        classify: classifyMs,
        //
        cssMs,
        cssMinifyMs,
        //
        ...(!isUsingLightningCss
          ? {
              lightningCssMs,
              lightningCssMinifiedMs,
            }
          : {}),
        //
        extractTotal: totalMs,
        extractTimeByFiles: Object.fromEntries(timesMap.entries()),
      },
      fileSizes: {
        lineCount: css.split('\n').length,
        normal: filesize(Buffer.byteLength(css, 'utf-8')),
        minified: filesize(Buffer.byteLength(minifiedCss, 'utf-8')),
        gzip: {
          normal: filesize(gzipSizeSync(css)),
          minified: filesize(gzipSizeSync(minifiedCss)),
        },
        lightningCss: !isUsingLightningCss
          ? {
              normal: filesize(Buffer.byteLength(lightningCss, 'utf-8')),
              minified: filesize(Buffer.byteLength(lightningCssMinifiedCss, 'utf-8')),
            }
          : undefined,
      },
    },
    analysis.details,
  ) satisfies ReportSnapshot['details']

  const { globalCss, ...config } = ctx.config

  return {
    schemaVersion: version,
    details,
    propByIndex: analysis.propById,
    componentByIndex: analysis.componentById,
    derived: analysis.derived,
    config,
  }
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

export const writeAnalyzeJSON = (filePath: string, result: ReportSnapshot, ctx: PandaContext) => {
  const dirname = ctx.runtime.path.dirname(filePath)
  ctx.runtime.fs.ensureDirSync(dirname)

  return writeFile(filePath, JSON.stringify(result, analyzeResultSerializer, 2))
}
