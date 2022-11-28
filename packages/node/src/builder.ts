import { discardDuplicate } from '@pandacss/core'
import { ConfigNotFoundError } from '@pandacss/error'
import { logger } from '@pandacss/logger'
import { toHash } from '@pandacss/shared'
import { existsSync, readFileSync } from 'fs'
import { statSync } from 'fs-extra'
import { resolve } from 'path'
import type { Message, Root } from 'postcss'
import { emitArtifacts, getBaseCss } from './artifacts'
import { findConfig, loadConfigAndCreateContext } from './config'
import type { PandaContext } from './context'
import { extractFile } from './extract'
import { parseDependency } from './glob'

type CachedData = {
  fileMap: Map<string, string>
  fileModifiedMap: Map<string, number>
}

const contextCache = new Map<string, PandaContext>()
const builderCache = new WeakMap<PandaContext, CachedData>()

function getConfigHash() {
  const file = findConfig()
  if (!file) {
    throw new ConfigNotFoundError()
  }
  return toHash(readFileSync(file, 'utf-8'))
}

export class Builder {
  fileModifiedMap: Map<string, number> = new Map()
  fileMap: Map<string, string> = new Map()
  context: PandaContext | undefined
  configChanged = true

  updateFile(file: string, css: string) {
    const oldCss = this.fileMap?.get(file) ?? ''
    const newCss = discardDuplicate(oldCss + css)
    this.fileMap?.set(file, newCss)
  }

  async setup() {
    const configHash = getConfigHash()
    const cachedContext = contextCache.get(configHash)

    if (cachedContext) {
      cachedContext.reloadSourceFiles()
      this.context = cachedContext

      this.fileMap = builderCache.get(cachedContext)!.fileMap
      this.fileModifiedMap = builderCache.get(cachedContext)!.fileModifiedMap

      //
    } else {
      //

      this.context = await loadConfigAndCreateContext()
      emitArtifacts(this.context) //no need to await this

      this.fileMap = new Map([['base.css', getBaseCss(this.context)]])
      this.fileModifiedMap = new Map()

      contextCache.set(configHash, this.context)
      builderCache.set(this.context, { fileMap: this.fileMap, fileModifiedMap: this.fileModifiedMap })
    }
  }

  ensure() {
    if (!this.context) throw new Error('context not loaded')
    return this.context
  }

  async extract() {
    const ctx = this.ensure()

    const done = logger.time.info('Extracted in')

    await ctx.extract(async (file) => {
      const mtime = existsSync(file) ? statSync(file).mtimeMs : -Infinity

      const isUnchanged = this.fileModifiedMap.has(file) && mtime === this.fileModifiedMap.get(file)
      if (isUnchanged) return

      const result = extractFile(ctx, file)
      if (!result) return

      this.fileModifiedMap.set(file, mtime)
      this.updateFile(file, result.css)
      return result
    })

    done()
  }

  toString() {
    return Array.from(this.fileMap.values()).join('')
  }

  write(root: Root) {
    const prev = root.toString()
    root.removeAll()
    const css = discardDuplicate(prev + this.toString())
    root.append(css)
  }

  registerDependency(fn: (dep: Message) => void) {
    const ctx = this.ensure()

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
