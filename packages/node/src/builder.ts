import { findConfig, getConfigDependencies } from '@pandacss/config'
import { optimizeCss } from '@pandacss/core'
import { logger } from '@pandacss/logger'
import { PandaError, uniq } from '@pandacss/shared'
import type { DiffConfigResult } from '@pandacss/types'
import { existsSync, statSync } from 'fs'
import { normalize, resolve } from 'path'
import type { Message, Root } from 'postcss'
import { codegen } from './codegen'
import { loadConfigAndCreateContext } from './config'
import { PandaContext } from './create-context'
import { parseDependency } from './parse-dependency'

const fileModifiedMap = new Map<string, number>()
interface FileChanges {
  changes: Map<string, FileMeta>
  hasFilesChanged: boolean
}

export class Builder {
  /**
   * The current panda context
   */
  context: PandaContext | undefined

  private hasEmitted = false
  private filesMeta: FileChanges | undefined
  private explicitDepsMeta: FileChanges | undefined
  private affecteds: DiffConfigResult | undefined
  private configDependencies: Set<string> = new Set()

  setConfigDependencies(options: SetupContextOptions) {
    const tsOptions = this.context?.conf.tsOptions ?? { baseUrl: undefined, pathMappings: [] }
    const compilerOptions = this.context?.conf.tsconfig?.compilerOptions ?? {}

    const { deps: foundDeps } = getConfigDependencies(options.configPath, tsOptions, compilerOptions)
    const cwd = options?.cwd ?? this.context?.config.cwd ?? process.cwd()

    const configDeps = new Set([
      ...foundDeps,
      ...(this.context?.conf.dependencies ?? []).map((file) => resolve(cwd, file)),
    ])

    configDeps.forEach((file) => {
      this.configDependencies.add(file)
    })

    logger.debug('builder', 'Config dependencies')
    logger.debug('builder', configDeps)
  }

  setup = async (options: { configPath?: string; cwd?: string } = {}) => {
    logger.debug('builder', '🚧 Setup')

    const configPath = options.configPath ?? findConfig({ cwd: options.cwd })
    this.setConfigDependencies({ configPath, cwd: options.cwd })

    if (!this.context) {
      return this.setupContext({ configPath, cwd: options.cwd })
    }

    const ctx = this.getContextOrThrow()

    this.affecteds = await ctx.diff.reloadConfigAndRefreshContext((conf) => {
      this.context = new PandaContext(conf)
    })

    logger.debug('builder', this.affecteds)

    // explicit config dependencies change
    this.explicitDepsMeta = this.checkFilesChanged(this.context.explicitDeps)

    if (this.explicitDepsMeta.hasFilesChanged) {
      this.explicitDepsMeta.changes.forEach((meta, file) => {
        fileModifiedMap.set(file, meta.mtime)
      })

      logger.debug('builder', '⚙️ Explicit config dependencies changed')
      this.affecteds.hasConfigChanged = true
    }

    // config change
    if (this.affecteds.hasConfigChanged) {
      logger.debug('builder', '⚙️ Config changed, reloading')
      await ctx.hooks['config:change']?.({ config: ctx.config, changes: this.affecteds })
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

      // Passing undefined will emit all artifacts again
      // this can happen when an explicit config dependency changes (since we can't know which artifact is affected in that case)
      const ids = this.affecteds.artifacts.size ? Array.from(this.affecteds.artifacts) : undefined
      await codegen(this.getContextOrThrow(), ids)
    }

    this.hasEmitted = true
  }

  setupContext = async (options: SetupContextOptions) => {
    const { configPath, cwd } = options

    const ctx = await loadConfigAndCreateContext({ configPath, cwd })

    const configDeps = uniq([...ctx.conf.dependencies, ...ctx.explicitDeps])

    configDeps.forEach((file) => {
      this.configDependencies.add(resolve(cwd || ctx.conf.config.cwd, file))
    })

    this.context = ctx
    return ctx
  }

  getContextOrThrow = (): PandaContext => {
    if (!this.context) {
      throw new PandaError('NO_CONTEXT', 'context not loaded')
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

  write = (root: Root) => {
    const ctx = this.getContextOrThrow()
    const sheet = ctx.createSheet()
    ctx.appendBaselineCss(sheet)
    const css = ctx.getCss(sheet)

    root.append(
      optimizeCss(css, {
        browserslist: ctx.config.browserslist,
        minify: ctx.config.minify,
        lightningcss: ctx.config.lightningcss,
      }),
    )
  }

  registerDependency = (fn: (dep: Message) => void) => {
    const ctx = this.getContextOrThrow()

    for (const fileOrGlob of ctx.config.include) {
      const dependency = parseDependency(fileOrGlob)
      if (dependency) fn(dependency)
    }

    for (const file of this.configDependencies) {
      fn({ type: 'dependency', file: normalize(resolve(file)) })
    }
  }
}

interface FileMeta {
  mtime: number
  isUnchanged: boolean
}

interface SetupContextOptions {
  configPath: string
  cwd?: string
}
