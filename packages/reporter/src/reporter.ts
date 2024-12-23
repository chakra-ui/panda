import type { ParserOptions, Stylesheet } from '@pandacss/core'
import type { Generator } from '@pandacss/generator'
import { logger } from '@pandacss/logger'
import type { AnalysisReport, ClassifyReport, ParserResultInterface } from '@pandacss/types'
import { version } from '../package.json'
import { analyzeRecipes, type RecipeReportEntry } from './reporter-recipe'
import { analyzeTokens, type TokenReportEntry } from './reporter-token'

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

  get report() {
    return this.#report
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

  init = (): void => {
    const { project } = this.options

    this.setup()
    const classify = project.classify(this.#parserResults)

    this.#report = {
      schemaVersion: version,
      details: classify.details,
      propByIndex: classify.propById,
      componentByIndex: classify.componentById,
      derived: classify.derived,
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
