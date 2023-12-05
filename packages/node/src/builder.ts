import { optimizeCss } from '@pandacss/core'
import { ConfigNotFoundError } from '@pandacss/error'
import { logger } from '@pandacss/logger'
import { existsSync } from 'fs'
import fsExtra from 'fs-extra'
import pLimit from 'p-limit'
import { resolve } from 'pathe'
import type { Message, Root } from 'postcss'
import { findConfig, loadConfigAndCreateContext } from './config'
import { PandaContext } from './create-context'
import type { DiffConfigResult } from './diff-engine'
import { emitArtifacts } from './emit-artifact'
import { extractFile } from './extract'
import { parseDependency } from './parse-dependency'

const fileModifiedMap = new Map<string, number>()

const limit = pLimit(20)

export class Builder {
  /**
   * The current panda context
   */
  context: PandaContext | undefined

  private hasEmitted = false
  private hasConfigChanged = false
  private affecteds: DiffConfigResult | undefined

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
    if (!this.context) {
      return this.setupContext({ configPath, cwd: options.cwd })
    }

    const ctx = this.getContextOrThrow()
    this.affecteds = await ctx.diff.reloadConfigAndRefreshContext((conf) => {
      this.context = new PandaContext({ ...conf, hooks: ctx.hooks })
      this.context.appendBaselineCss()
    })

    this.hasConfigChanged = this.affecteds.hasConfigChanged

    if (this.affecteds.hasConfigChanged) {
      logger.debug('builder', '⚙️ Config changed, reloading')
      await ctx.hooks.callHook('config:change', ctx.config)
      return
    }

    ctx.project.reloadSourceFiles()
  }

  async emit() {
    // ensure emit is only called when the config is changed
    if (this.hasEmitted && this.affecteds?.hasConfigChanged) {
      await emitArtifacts(this.getContextOrThrow(), Array.from(this.affecteds.artifacts))
    }

    this.hasEmitted = true
  }

  setupContext = async (options: { configPath: string; cwd?: string }) => {
    const { configPath, cwd } = options
    const ctx = await loadConfigAndCreateContext({ configPath, cwd })
    ctx.appendBaselineCss()
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
    const mtime = existsSync(file) ? fsExtra.statSync(file).mtimeMs : -Infinity
    const isUnchanged = fileModifiedMap.has(file) && mtime === fileModifiedMap.get(file)
    return { mtime, isUnchanged }
  }

  extractFile = async (ctx: PandaContext, file: string) => {
    const meta = this.getFileMeta(file)

    if (meta.isUnchanged && !this.hasConfigChanged) return

    const result = extractFile(ctx, file)
    fileModifiedMap.set(file, meta.mtime)

    return result
  }

  checkFilesChanged(files: string[]) {
    return files.some((file) => !this.getFileMeta(file).isUnchanged)
  }

  extract = async () => {
    const ctx = this.getContextOrThrow()
    const files = ctx.getFiles()

    // if file is unchanged and config is unchanged, skip
    // (sometimes vite and nextjs will trigger a rebuild without any changes)
    if (!this.hasConfigChanged && !this.checkFilesChanged(files)) return

    const done = logger.time.info('Extracted in')

    // limit concurrency since we might parse a lot of files
    const promises = files.map((file) => limit(() => this.extractFile(ctx, file)))
    await Promise.allSettled(promises)

    done()
  }

  toString = () => {
    const ctx = this.getContextOrThrow()
    return ctx.getCss()
  }

  isValidRoot = (root: Root) => {
    const ctx = this.getContextOrThrow()
    let valid = false

    root.walkAtRules('layer', (rule) => {
      if (ctx.layers.isValidParams(rule.params)) {
        valid = true
      }
    })

    return valid
  }

  write = (root: Root) => {
    root.append(this.toString())
    optimizeCss(root)
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
      fn({ type: 'dependency', file: resolve(file) })
    }
  }
}
