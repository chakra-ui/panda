import { optimizeCss } from '@pandacss/core'
import { ConfigNotFoundError } from '@pandacss/error'
import { logger } from '@pandacss/logger'
import { existsSync } from 'fs'
import fsExtra from 'fs-extra'
import pLimit from 'p-limit'
import { resolve } from 'path'
import type { Message, Root } from 'postcss'
import { findConfig, loadConfigAndCreateContext } from './config'
import { type PandaContext } from './create-context'
import { emitArtifacts, extractFile } from './extract'
import { parseDependency } from './parse-dependency'
import type { AffectedResult } from './diff-engine'

const fileCssMap = new Map<string, string>()
const fileModifiedMap = new Map<string, number>()

const limit = pLimit(20)
export class Builder {
  /**
   * The current panda context
   */
  context: PandaContext | undefined

  hasEmitted = false
  affecteds: AffectedResult | undefined
  configDependencies = new Set<string>()

  getConfigPath = () => {
    const configPath = findConfig()

    if (!configPath) {
      throw new ConfigNotFoundError()
    }

    return configPath
  }

  setup = async (options: { configPath?: string; cwd?: string; from?: string } = {}) => {
    logger.debug('builder', '🚧 Setup')

    const configPath = options.configPath ?? this.getConfigPath()
    if (!this.context) {
      return this.setupContext({ configPath })
    }

    const ctx = this.getContextOrThrow()
    this.affecteds = await ctx.diff.reloadConfigAndRefreshCtx()

    if (this.affecteds.hasConfigChanged) {
      logger.debug('builder', '⚙️ Config changed, reloading')
      await ctx.hooks.callHook('config:change', ctx.config)
      return
    }

    ctx.project.reloadSourceFiles()
  }

  emit() {
    // ensure emit is only called when the config is changed
    if (this.hasEmitted && this.affecteds?.hasConfigChanged) {
      emitArtifacts(this.getContextOrThrow(), Array.from(this.affecteds.artifacts))
    }

    this.hasEmitted = true
  }

  setupContext = async (options: { configPath: string }) => {
    const { configPath } = options
    const ctx = await loadConfigAndCreateContext({ configPath })

    this.context = ctx
    return ctx
  }

  getContextOrThrow = (): PandaContext => {
    if (!this.context) {
      throw new Error('context not loaded')
    }
    return this.context
  }

  extractFile = async (ctx: PandaContext, file: string) => {
    const mtime = existsSync(file) ? fsExtra.statSync(file).mtimeMs : -Infinity

    const isUnchanged = fileModifiedMap.has(file) && mtime === fileModifiedMap.get(file)
    if (isUnchanged) return

    const css = extractFile(ctx, file)
    if (!css) {
      fileModifiedMap.set(file, mtime)
      fileCssMap.delete(file)
      return
    }

    fileCssMap.set(file, css)

    return css
  }

  extract = async () => {
    const ctx = this.getContextOrThrow()

    const done = logger.time.info('Extracted in')

    // limit concurrency since we might parse a lot of files
    const promises = ctx.getFiles().map((file) => limit(() => this.extractFile(ctx, file)))
    await Promise.allSettled(promises)

    done()
  }

  toString = () => {
    const ctx = this.getContextOrThrow()
    return ctx.getCss({
      files: Array.from(fileCssMap.values()),
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
      optimizeCss(`
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

    for (const file of ctx.conf.dependencies) {
      fn({ type: 'dependency', file: resolve(file) })
    }

    for (const file of this.configDependencies) {
      fn({ type: 'dependency', file: resolve(file) })
    }
  }
}
