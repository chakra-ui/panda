import { findConfig, type DiffConfigResult } from '@pandacss/config'
import { optimizeCss } from '@pandacss/core'
import { ConfigNotFoundError } from '@pandacss/error'
import { logger } from '@pandacss/logger'
import { existsSync, statSync } from 'fs'
import type { Message, Root } from 'postcss'
import { codegen } from './codegen'
import { loadConfigAndCreateContext } from './config'
import { PandaContext } from './create-context'
import { parseDependency } from './parse-dependency'

const fileModifiedMap = new Map<string, number>()

export class Builder {
  /**
   * The current panda context
   */
  context: PandaContext | undefined

  private hasEmitted = false
  private filesMeta: { changes: Map<string, FileMeta>; hasFilesChanged: boolean } | undefined
  private affecteds: DiffConfigResult | undefined

  getConfigPath = (cwd?: string) => {
    const configPath = findConfig({ cwd })

    if (!configPath) {
      throw new ConfigNotFoundError()
    }

    return configPath
  }

  setup = async (options: { configPath?: string; cwd?: string } = {}) => {
    logger.debug('builder', '🚧 Setup')

    const configPath = options.configPath ?? this.getConfigPath(options.cwd)

    if (!this.context) {
      return this.setupContext({ configPath, cwd: options.cwd })
    }

    const ctx = this.getContextOrThrow()

    this.affecteds = await ctx.diff.reloadConfigAndRefreshContext((conf) => {
      this.context = new PandaContext({ ...conf, hooks: ctx.hooks })
    })

    logger.debug('builder', this.affecteds)

    // config change
    if (this.affecteds.hasConfigChanged) {
      logger.debug('builder', '⚙️ Config changed, reloading')
      await ctx.hooks.callHook('config:change', ctx.config)
      return
    }

    // file changes
    this.filesMeta = this.checkFilesChanged(ctx.getFiles())
    if (this.filesMeta.hasFilesChanged) {
      logger.debug('builder', 'Files changed, invalidating them')
      ctx.project.reloadSourceFiles()
    }
  }

  async emit() {
    // ensure emit is only called when the config is changed
    if (this.hasEmitted && this.affecteds?.hasConfigChanged) {
      logger.debug('builder', 'Emit artifacts after config change')
      await codegen(this.getContextOrThrow(), Array.from(this.affecteds.artifacts))
    }

    this.hasEmitted = true
  }

  setupContext = async (options: { configPath: string; cwd?: string }) => {
    const { configPath, cwd } = options

    const ctx = await loadConfigAndCreateContext({ configPath, cwd })
    this.context = ctx

    return ctx
  }

  getContextOrThrow = (): PandaContext => {
    if (!this.context) {
      throw new Error('context not loaded')
    }
    return this.context
  }

  getFileMeta = (file: string) => {
    const mtime = existsSync(file) ? statSync(file).mtimeMs : -Infinity
    const isUnchanged = fileModifiedMap.has(file) && mtime === fileModifiedMap.get(file)
    return { mtime, isUnchanged }
  }

  checkFilesChanged(files: string[]) {
    const changes = new Map<string, FileMeta>()

    let hasFilesChanged = false

    for (const file of files) {
      const meta = this.getFileMeta(file)
      changes.set(file, meta)
      if (!meta.isUnchanged) {
        hasFilesChanged = true
      }
    }

    return { changes, hasFilesChanged }
  }

  extractFile = (ctx: PandaContext, file: string) => {
    const meta = this.filesMeta?.changes.get(file) ?? this.getFileMeta(file)

    const hasConfigChanged = this.affecteds ? this.affecteds.hasConfigChanged : true
    if (meta.isUnchanged && !hasConfigChanged) return

    const parserResult = ctx.parseFile(file)
    fileModifiedMap.set(file, meta.mtime)

    return parserResult
  }

  extract = () => {
    const hasConfigChanged = this.affecteds ? this.affecteds.hasConfigChanged : true
    if (!this.filesMeta && !hasConfigChanged) {
      logger.debug('builder', 'No files or config changed, skipping extract')
      return
    }

    const ctx = this.getContextOrThrow()
    const files = ctx.getFiles()

    const done = logger.time.info('Extracted in')

    files.map((file) => this.extractFile(ctx, file))

    done()
  }

  isValidRoot = (root: Root) => {
    const ctx = this.getContextOrThrow()
    let valid = false

    root.walkAtRules('layer', (rule) => {
      if (ctx.isValidLayerParams(rule.params)) {
        valid = true
      }
    })

    return valid
  }

  private initialRoot: string | undefined

  write = (root: Root) => {
    if (!this.initialRoot) {
      this.initialRoot = root.toString()
    }

    root.removeAll()

    const ctx = this.getContextOrThrow()

    const sheet = ctx.createSheet()
    ctx.appendBaselineCss(sheet)
    ctx.appendParserCss(sheet)
    const css = ctx.getCss(sheet)

    root.append(
      optimizeCss(`
    ${this.initialRoot}
    ${css}
    `),
    )
  }

  registerDependency = (fn: (dep: Message) => void) => {
    const ctx = this.getContextOrThrow()

    for (const fileOrGlob of ctx.config.include) {
      const dependency = parseDependency(fileOrGlob)
      if (dependency) {
        fn(dependency)
      }
    }

    for (const file of ctx.conf.dependencies) {
      fn({ type: 'dependency', file: ctx.runtime.path.resolve(file) })
    }
  }
}

interface FileMeta {
  mtime: number
  isUnchanged: boolean
}
