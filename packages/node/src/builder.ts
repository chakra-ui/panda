import { getConfigDependencies } from '@pandacss/config'
import { discardDuplicate, mergeCss } from '@pandacss/core'
import { ConfigNotFoundError } from '@pandacss/error'
import { logger } from '@pandacss/logger'
import { existsSync } from 'fs'
import { statSync } from 'fs-extra'
import { resolve } from 'path'
import type { Message, Root } from 'postcss'
import { findConfig, loadConfigAndCreateContext } from './config'
import { type PandaContext } from './create-context'
import { emitArtifacts, extractFile } from './extract'
import { parseDependency } from './parse-dependency'

type ContentData = {
  fileCssMap: Map<string, string>
  fileModifiedMap: Map<string, number>
}

type ConfigData = {
  context: PandaContext
  deps: Set<string>
  depsModifiedMap: Map<string, number>
}

type ConfigDepsResult = {
  modifiedMap: Map<string, number>
  isModified: boolean
}

const configCache = new Map<string, ConfigData>()
const contentFilesCache = new WeakMap<PandaContext, ContentData>()

let setupCount = 0

export class Builder {
  /**
   * The current panda context
   */
  context: PandaContext | undefined

  configDependencies: Set<string> = new Set()

  writeFileCss = (file: string, css: string) => {
    const oldCss = this.fileCssMap?.get(file) ?? ''
    const newCss = mergeCss(oldCss, css)
    this.fileCssMap?.set(file, newCss)
  }

  checkConfigDeps = (configPath: string, deps: Set<string>): ConfigDepsResult => {
    let modified = false

    const newModified = new Map()
    const prevModified = configCache.get(configPath)?.depsModifiedMap

    for (const file of deps) {
      const stats = statSync(file, { throwIfNoEntry: false })
      if (!stats) continue

      const time = stats.mtimeMs
      newModified.set(file, time)

      if (!prevModified || !prevModified.has(file) || time > prevModified.get(file)!) {
        modified = true
      }
    }

    if (!modified) {
      return { isModified: false, modifiedMap: prevModified! }
    }

    for (const file of deps) {
      delete require.cache[file]
    }

    if (setupCount > 0) {
      logger.debug('builder', '⚙️ Config changed, reloading')
    }

    return { isModified: true, modifiedMap: newModified }
  }

  getConfigPath = () => {
    const configPath = findConfig()

    if (!configPath) {
      throw new ConfigNotFoundError()
    }

    return configPath
  }

  setup = async (options: { configPath?: string; cwd?: string } = {}) => {
    logger.debug('builder', '🚧 Setup')

    const configPath = options.configPath ?? this.getConfigPath()
    const tsOptions = this.context?.tsOptions ?? { baseUrl: undefined, pathMappings: [] }
    const compilerOptions = this.context?.tsconfig?.compilerOptions ?? {}

    const { deps: foundDeps } = getConfigDependencies(configPath, tsOptions, compilerOptions)
    const cwd = options?.cwd ?? this.context?.config.cwd ?? process.cwd()

    const configDeps = new Set([...foundDeps, ...(this.context?.dependencies ?? []).map((file) => resolve(cwd, file))])
    this.configDependencies = configDeps

    const deps = this.checkConfigDeps(configPath, configDeps)

    if (deps.isModified) {
      await this.setupContext({
        configPath,
        depsModifiedMap: deps.modifiedMap,
      })
      const ctx = this.context!
      await ctx.hooks.callHook('config:change', ctx.config)
    }

    const cache = configCache.get(configPath)

    if (cache) {
      this.context = cache.context
      this.context.project.reloadSourceFiles()

      //
    } else {
      await this.setupContext({
        configPath,
        depsModifiedMap: deps.modifiedMap,
      })
    }

    setupCount++
  }

  setupContext = async (options: { configPath: string; depsModifiedMap: Map<string, number> }) => {
    const { configPath, depsModifiedMap } = options

    this.context = await loadConfigAndCreateContext({ configPath })

    // don't emit artifacts on first setup
    if (setupCount > 0) {
      emitArtifacts(this.context) // no need to await this
    }

    configCache.set(configPath, {
      context: this.context,
      deps: new Set(this.context.dependencies ?? []),
      depsModifiedMap,
    })

    contentFilesCache.set(this.context, {
      fileCssMap: new Map(),
      fileModifiedMap: new Map(),
    })
  }

  getContextOrThrow = (): PandaContext => {
    if (!this.context) {
      throw new Error('context not loaded')
    }
    return this.context
  }

  get fileModifiedMap() {
    const ctx = this.getContextOrThrow()
    return contentFilesCache.get(ctx)!.fileModifiedMap
  }

  get fileCssMap() {
    const ctx = this.getContextOrThrow()
    return contentFilesCache.get(ctx)!.fileCssMap
  }

  extractFile = async (ctx: PandaContext, file: string) => {
    const mtime = existsSync(file) ? statSync(file).mtimeMs : -Infinity

    const isUnchanged = this.fileModifiedMap.has(file) && mtime === this.fileModifiedMap.get(file)
    if (isUnchanged) return

    const css = extractFile(ctx, file)
    if (!css) return

    this.fileModifiedMap.set(file, mtime)
    this.writeFileCss(file, css)

    return css
  }

  extract = async () => {
    const ctx = this.getContextOrThrow()

    const done = logger.time.info('Extracted in')

    await Promise.allSettled(ctx.getFiles().map((file) => this.extractFile(ctx, file)))

    done()
  }

  toString = () => {
    const ctx = this.getContextOrThrow()
    return ctx.getCss({
      files: Array.from(this.fileCssMap.values()),
      resolve: true,
    })
  }

  isValidRoot = (root: Root) => {
    const ctx = this.getContextOrThrow()
    let valid = false

    root.walkAtRules('layer', (rule) => {
      if (ctx.isValidLayerRule(rule.params)) {
        valid = true
      }
    })

    return valid
  }

  write = (root: Root) => {
    const rootCssContent = root.toString()
    root.removeAll()

    root.append(
      discardDuplicate(`
    ${rootCssContent}
    ${this.toString()}
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

    for (const file of ctx.dependencies) {
      fn({ type: 'dependency', file: resolve(file) })
    }

    for (const file of this.configDependencies) {
      fn({ type: 'dependency', file: resolve(file) })
    }
  }
}
