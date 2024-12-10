import type { ParserOptions, Stylesheet } from '@pandacss/core'
import type { Generator } from '@pandacss/generator'
import { logger } from '@pandacss/logger'
import { omit } from '@pandacss/shared'
import type { AnalysisReport, ClassifyReport, ParserResultInterface } from '@pandacss/types'
import { version } from '../package.json'
import { getFileSize, getZipFileSize } from './file-size'
import { analyzeTokens, type TokenReportEntry } from './reporter-token'
import { analyzeRecipes, type RecipeReportEntry } from './reporter-recipe'

export class Reporter {
  #parserResults = new Map<string, ParserResultInterface>()
  #extractTimes = new Map<string, number>()
  #sheet!: Stylesheet
  #report!: AnalysisReport

  constructor(
    private ctx: Generator,
    private options: ReporterOptions,
  ) {}

  private setup = (): void => {
    this.#sheet = this.ctx.createSheet()
    this.ctx.appendLayerParams(this.#sheet)
    this.ctx.appendBaselineCss(this.#sheet)
    this.parseFiles()
    this.ctx.appendParserCss(this.#sheet)
  }

  private get totalExtractTime(): number {
    return sum(Array.from(this.#extractTimes.values()))
  }

  get report() {
    return this.#report
  }

  private getCss = (minify: boolean): ResultWithMs => {
    const startMs = performance.now()
    this.ctx.config.minify = minify
    const result = this.ctx.getCss(this.#sheet)
    const ms = performance.now() - startMs
    return { result, ms }
  }

  private parseFiles = (): void => {
    const { getFiles } = this.options

    const files = getFiles()
    logger.info('analyze', `Analyzing ${files.length} file(s) for token and recipe usage...`)

    for (const file of files) {
      this.parseFile(file)
    }
  }

  private parseFile = (file: string): void => {
    const { project, getRelativePath, onResult } = this.options
    const { config } = this.ctx

    const start = performance.now()
    const result = project.parseSourceFile?.(file)

    const extractMs = performance.now() - start
    const filePath = getRelativePath(config.cwd, file)

    this.#extractTimes.set(filePath, extractMs)
    logger.debug('analyze', `Parsed ${file} in ${extractMs}ms`)

    if (result) {
      this.#parserResults.set(filePath, result)
      onResult?.(file, result)
    }
  }

  private classify = (): ResultWithMs<ClassifyReport> => {
    const { project } = this.options
    const start = performance.now()
    const result = project.classify(this.#parserResults)
    const ms = performance.now() - start
    return { result, ms }
  }

  init = (): void => {
    this.setup()
    const classify = this.classify()

    const css = this.getCss(false)
    const minifiedCss = this.getCss(true)

    let lightningCss: ResultWithMs<string> = { result: '', ms: 0 }
    let lightningCssMinified: ResultWithMs<string> = { result: '', ms: 0 }

    const lightningCssEnabled = this.ctx.config.lightningcss

    if (!lightningCssEnabled) {
      this.#sheet['context'].lightningcss = true
      lightningCss = this.getCss(false)
      lightningCssMinified = this.getCss(true)
    }

    const details: AnalysisReport['details'] = {
      ...classify.result.details,
      duration: {
        classify: classify.ms,
        cssMs: css.ms,
        cssMinifyMs: minifiedCss.ms,
        ...(!lightningCssEnabled
          ? { lightningCssMs: lightningCss.ms, lightningCssMinifiedMs: lightningCssMinified.ms }
          : {}),
        extractTotal: this.totalExtractTime,
        extractTimeByFiles: Object.fromEntries(this.#extractTimes.entries()),
      },
      fileSizes: {
        lineCount: css.result.split('\n').length,
        normal: getFileSize(css.result),
        minified: getFileSize(minifiedCss.result),
        gzip: {
          normal: getZipFileSize(css.result),
          minified: getZipFileSize(minifiedCss.result),
        },
        lightningCss: !lightningCssEnabled
          ? { normal: getFileSize(lightningCss.result), minified: getFileSize(lightningCssMinified.result) }
          : undefined,
      },
    }

    this.#report = {
      schemaVersion: version,
      details,
      propByIndex: classify.result.propById,
      componentByIndex: classify.result.componentById,
      derived: classify.result.derived,
      config: omit(this.ctx.config, ['globalCss', 'globalFontface']),
    }
  }

  getTokenReport = (): TokenReportEntry[] => {
    const { project } = this.options
    return analyzeTokens(project.parserOptions, this.#report)
  }

  getRecipeReport = (): RecipeReportEntry[] => {
    const { project } = this.options
    return analyzeRecipes(project.parserOptions, this.#report)
  }
}

const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0)

interface ResultWithMs<T = string> {
  result: T
  ms: number
}

export interface ReporterOptions {
  onResult?: (file: string, result: ParserResultInterface) => void
  project: {
    parserOptions: ParserOptions
    parseSourceFile: (file: string) => ParserResultInterface | undefined
    classify: (fileMap: Map<string, ParserResultInterface>) => ClassifyReport
  }
  getFiles: () => string[]
  getRelativePath: (cwd: string, file: string) => string
}
