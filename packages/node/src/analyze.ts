import { logger } from '@pandacss/logger'
import { omit } from '@pandacss/shared'
import type { AnalysisOptions, AnalysisReport, ParserResultInterface } from '@pandacss/types'
import { writeFile } from 'node:fs/promises'
import { relative } from 'node:path'
import { version } from '../package.json'
import { classifyTokens } from './classify'
import type { PandaContext } from './create-context'
import { getFileSize, getZipFileSize } from './file-size'

export function analyze(ctx: PandaContext, options: AnalysisOptions = {}): AnalysisReport {
  const filesMap = new Map<string, ParserResultInterface>()
  const timesMap = new Map<string, number>()

  const files = ctx.getFiles()

  logger.info('analyze', `Analyzing ${files.length} file(s) for token and recipe usage`)

  const sheet = ctx.createSheet()
  ctx.appendLayerParams(sheet)
  ctx.appendBaselineCss(sheet)

  files.forEach((file) => {
    const start = performance.now()
    const result = ctx.project.parseSourceFile(file)

    const extractMs = performance.now() - start
    const relativePath = relative(ctx.config.cwd, file)

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
        normal: getFileSize(css),
        minified: getFileSize(minifiedCss),
        gzip: {
          normal: getZipFileSize(css),
          minified: getZipFileSize(minifiedCss),
        },
        lightningCss: !isUsingLightningCss
          ? {
              normal: getFileSize(lightningCss),
              minified: getFileSize(lightningCssMinifiedCss),
            }
          : undefined,
      },
    },
    analysis.details,
  ) satisfies AnalysisReport['details']

  return {
    schemaVersion: version,
    details,
    propByIndex: analysis.propById,
    componentByIndex: analysis.componentById,
    derived: analysis.derived,
    config: omit(ctx.config, ['globalCss', 'globalFontface']),
  }
}

function replacer(_: string, value: any) {
  if (value instanceof Set) return Array.from(value)
  if (value instanceof Map) return Object.fromEntries(value)
  return value
}

export function writeAnalyzeJSON(filePath: string, result: AnalysisReport, ctx: PandaContext) {
  const dirname = ctx.runtime.path.dirname(filePath)
  ctx.runtime.fs.ensureDirSync(dirname)
  return writeFile(filePath, JSON.stringify(result, replacer, 2))
}
