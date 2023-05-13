import { discardDuplicate, mergeCss } from '@pandacss/core'
import { ConfigNotFoundError } from '@pandacss/error'
import { logger } from '@pandacss/logger'
import { toHash } from '@pandacss/shared'
import { existsSync, readFileSync } from 'fs'
import { statSync } from 'fs-extra'
import { resolve } from 'path'
import type { Message, Root } from 'postcss'
import { findConfig, loadConfigAndCreateContext } from './config'
import type { PandaContext } from './create-context'
import { emitArtifacts, extractFile } from './extract'
import { parseDependency } from './parse-dependency'
import getModuleDependencies from './get-module-deps'

type CachedData = {
  fileCssMap: Map<string, string>
  fileModifiedMap: Map<string, number>
}

const contextCache = new Map<string, PandaContext>()
const builderCache = new WeakMap<PandaContext, CachedData>()

function getConfigHash() {
  const file = findConfig()
  if (!file) {
    throw new ConfigNotFoundError()
  }
  return { file, hash: toHash(readFileSync(file, 'utf-8')) }
}

let setupCount = 0

export class Builder {
  /**
   * Map of file path to modified time
   */
  fileModifiedMap: Map<string, number> = new Map()

  /**
   * Map of file path to css
   */
  fileCssMap: Map<string, string> = new Map()

  context: PandaContext | undefined

  configChanged = true

  configDepsModified: Map<string, number> | undefined

  writeFile(file: string, css: string) {
    const oldCss = this.fileCssMap?.get(file) ?? ''
    const newCss = mergeCss(oldCss, css)
    this.fileCssMap?.set(file, newCss)
  }

  async setup() {
    const { file: userConfigPath, hash } = getConfigHash()
    const newDeps = getModuleDependencies(userConfigPath)

    const prevModified = this.configDepsModified

    let modified = false
    const newModified = new Map()

    for (const file of newDeps) {
      const time = statSync(file).mtimeMs
      newModified.set(file, time)
      if (!prevModified || !prevModified.has(file) || time > prevModified.get(file)!) {
        modified = true
      }
    }
    this.configDepsModified = newModified

    // It has changed (based on timestamps)
    if (modified) {
      for (const file of newDeps) {
        delete require.cache[file]
      }

      if (setupCount > 0) {
        logger.info('postcss', 'Config changed, reloading')
      }

      await this.loadConfig(hash)
      return
    }

    const cachedContext = contextCache.get(hash)

    if (cachedContext) {
      cachedContext.project.reloadSourceFiles()
      this.context = cachedContext

      this.fileCssMap = builderCache.get(cachedContext)!.fileCssMap
      this.fileModifiedMap = builderCache.get(cachedContext)!.fileModifiedMap
      //
    } else {
      await this.loadConfig(hash)
    }

    setupCount++
  }

  async loadConfig(hash: string) {
    this.context = await loadConfigAndCreateContext()

    // don't emit artifacts on first setup
    if (setupCount > 0) {
      emitArtifacts(this.context) //no need to await this
    }

    this.fileCssMap = new Map()
    this.fileModifiedMap = new Map()

    contextCache.set(hash, this.context)
    builderCache.set(this.context, { fileCssMap: this.fileCssMap, fileModifiedMap: this.fileModifiedMap })
  }

  ensure(): PandaContext {
    if (!this.context) throw new Error('context not loaded')
    return this.context
  }

  async extract() {
    const ctx = this.ensure()

    const done = logger.time.info('Extracted in')

    await Promise.all(
      ctx.getFiles().map(async (file: string) => {
        const mtime = existsSync(file) ? statSync(file).mtimeMs : -Infinity

        const isUnchanged = this.fileModifiedMap.has(file) && mtime === this.fileModifiedMap.get(file)
        if (isUnchanged) return

        const css = extractFile(ctx, file)
        if (!css) return

        this.fileModifiedMap.set(file, mtime)
        this.writeFile(file, css)

        return css
      }),
    )

    done()
  }

  toString() {
    const ctx = this.ensure()
    return ctx.getCss({
      files: Array.from(this.fileCssMap.values()),
      resolve: true,
    })
  }

  // ASSUMPTION: Layer structure is an exact match (no extra layers)
  isValidRoot(root: Root) {
    const params = 'reset, base, tokens, recipes, utilities'

    let found = false

    root.walkAtRules('layer', (rule) => {
      if (rule.params === params) {
        found = true
      }
    })

    return found
  }

  write(root: Root) {
    const rootCssContent = root.toString()
    root.removeAll()

    root.append(
      discardDuplicate(`
    ${rootCssContent}
    ${this.toString()}
    `),
    )
  }

  registerDependency(fn: (dep: Message) => void) {
    const ctx = this.ensure()

    for (const fileOrGlob of ctx.config.include) {
      const dependency = parseDependency(fileOrGlob)
      if (dependency) {
        fn(dependency)
      }
    }

    for (const file of ctx.dependencies) {
      fn({ type: 'dependency', file: resolve(file) })
    }
  }
}
