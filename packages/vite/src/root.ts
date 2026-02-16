import { findConfig, getConfigDependencies } from '@pandacss/config'
import { logger } from '@pandacss/logger'
import { codegen, loadConfigAndCreateContext, PandaContext } from '@pandacss/node'
import type { ParserResult } from '@pandacss/parser'
import { normalize, resolve } from 'path'
import type { PandaViteOptions } from './index'

export class Root {
  ctx!: PandaContext
  configDeps = new Set<string>()

  /** Cache of ParserResults from build-mode parseFiles(), keyed by normalized file path */
  parseResults = new Map<string, ParserResult>()

  private options: PandaViteOptions

  constructor(options: PandaViteOptions) {
    this.options = options
  }

  async init() {
    const { configPath, cwd } = this.options

    this.ctx = await loadConfigAndCreateContext({ configPath, cwd })
    this.setConfigDependencies()

    logger.debug('vite', 'Context initialized')
  }

  async runCodegen() {
    const result = await codegen(this.ctx)
    logger.info('vite', result.msg)
  }

  async reload() {
    const affecteds = await this.ctx.diff.reloadConfigAndRefreshContext((conf) => {
      this.ctx = new PandaContext(conf)
    })

    this.setConfigDependencies()

    if (affecteds.hasConfigChanged) {
      logger.info('vite', 'Config changed, running codegen')
      await this.runCodegen()
    }
  }

  extractFile(id: string): { hasNew: boolean; result?: ParserResult } {
    const file = normalize(id)

    const prevSize = this.ctx.encoder.atomic.size + this.ctx.encoder.recipes.size

    let result: ParserResult | undefined
    try {
      this.ctx.project.reloadSourceFile(file)
      result = this.ctx.parseFile(file)
    } catch (error) {
      logger.error('vite', `Failed to parse ${file}`)
      logger.error('vite', error)
      return { hasNew: false }
    }

    const newSize = this.ctx.encoder.atomic.size + this.ctx.encoder.recipes.size
    return { hasNew: newSize > prevSize, result: result ?? undefined }
  }

  generateCss(): string {
    const sheet = this.ctx.createSheet()
    this.ctx.appendLayerParams(sheet)
    this.ctx.appendBaselineCss(sheet)
    this.ctx.appendParserCss(sheet)

    return this.ctx.getCss(sheet)
  }

  isConfigDep(file: string): boolean {
    const normalized = normalize(resolve(file))
    return this.configDeps.has(normalized)
  }

  private setConfigDependencies() {
    const configPath = this.options.configPath ?? findConfig({ cwd: this.options.cwd })
    const tsOptions = this.ctx.conf.tsOptions ?? { baseUrl: undefined, pathMappings: [] }
    const compilerOptions = this.ctx.conf.tsconfig?.compilerOptions ?? {}

    const { deps } = getConfigDependencies(configPath, tsOptions, compilerOptions)
    const cwd = this.options.cwd ?? this.ctx.config.cwd ?? process.cwd()

    this.configDeps.clear()

    for (const dep of deps) {
      this.configDeps.add(normalize(dep))
    }

    for (const dep of this.ctx.conf.dependencies ?? []) {
      this.configDeps.add(normalize(resolve(cwd, dep)))
    }
  }
}
