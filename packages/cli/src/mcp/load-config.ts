import { loadConfigAndCreateContext } from '@pandacss/node'
import type { PandaContext } from '@pandacss/node'
import { resolve } from 'path'

interface LoadConfigOptions {
  cwd?: string
  configPath?: string
}

let cachedContext: PandaContext | null = null
let cacheKey: string | null = null
let globalOptions: LoadConfigOptions = {}

export function setGlobalConfigOptions(options: LoadConfigOptions): void {
  globalOptions = options
}

export async function loadPandaContext(options: LoadConfigOptions = {}): Promise<PandaContext> {
  // Merge with global options
  const finalOptions = { ...globalOptions, ...options }
  const { cwd = process.cwd(), configPath } = finalOptions

  const currentCacheKey = `${cwd}:${configPath || 'default'}`

  // Return cached context if available and cache key matches
  if (cachedContext && cacheKey === currentCacheKey) {
    return cachedContext
  }

  try {
    const resolvedCwd = resolve(cwd)
    const ctx = await loadConfigAndCreateContext({
      cwd: resolvedCwd,
      configPath,
    })

    // Cache the context
    cachedContext = ctx
    cacheKey = currentCacheKey

    return ctx
  } catch (error) {
    throw new Error(`Failed to load Panda config: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export function clearConfigCache(): void {
  cachedContext = null
  cacheKey = null
}
