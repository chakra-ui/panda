import { applyConfigDefaults } from '@pandacss/compiler-shared'
import type { Config, UserConfig } from '@pandacss/types'
import { bundle } from './bundle'
import { PandaError } from './error'
import { findConfig } from './find'
import { collectPluginHookHandlers, normalizeHook } from './hooks'
import { resolveAuthoredPresets } from './preset'
import { createConfigSnapshot } from './serialize'
import { isPlainObject } from './shared'
import type { LoadConfigOptions, LoadedPandaConfig } from './types'

/**
 * Load and serialize a user's Panda config into a compiler-ready snapshot.
 * Bundles in memory (Rolldown + `data:` URL), then lowers functions to callback
 * refs and captures pattern transform source. The result feeds
 * `createCompilerFromSnapshot({ config, callbacks })`.
 *
 * Authored presets are resolved before defaults are applied; live hooks remain
 * in the JS host and only parser:before metadata crosses into Rust.
 */
export async function loadPandaConfig(options: LoadConfigOptions): Promise<LoadedPandaConfig> {
  const { cwd, file } = options

  const path = findConfig({ cwd, file })

  const { config, dependencies } = await bundle<Config>(path, cwd)

  if (!isPlainObject(config)) {
    throw new PandaError('CONFIG_ERROR', '💥 Config must export or return an object.')
  }

  // Resolve and default onto a copy — never mutate `config`: identical configs
  // share one cached `data:`-URL module, so mutation would leak `cwd` across loads.
  const authored = await resolveAuthoredPresets(config as UserConfig, cwd, {
    configFile: path,
    trackSources: options.trackSources,
    preserveRuntimeHooks: true,
  })
  const authoredDependencies = Array.from(
    new Set([...dependencies, ...authored.dependencies, ...(authored.config.dependencies ?? [])]),
  )
  const userConfig = await runConfigResolvedHooks(authored.config, path, authoredDependencies)
  const resolved = applyConfigDefaults(userConfig, cwd) as UserConfig

  // Explicit `config.dependencies` escape hatch, on top of bundled module ids.
  const dependencyList = Array.from(
    new Set([...dependencies, ...authored.dependencies, ...(resolved.dependencies ?? [])]),
  )

  const snapshot = createConfigSnapshot(resolved)

  return {
    path,
    config: snapshot.config,
    callbacks: snapshot.callbacks,
    ...(snapshot.hooks ? { hooks: snapshot.hooks } : {}),
    hostHooks: {
      'codegen:prepare': collectPluginHookHandlers(resolved, 'codegen:prepare'),
      'codegen:done': collectPluginHookHandlers(resolved, 'codegen:done'),
    },
    dependencies: dependencyList,
    ...(authored.metadata ? { metadata: authored.metadata } : {}),
  }
}

async function runConfigResolvedHooks(config: UserConfig, path: string, dependencies: string[]): Promise<UserConfig> {
  let current = config

  for (const entry of collectPluginHookHandlers(current, 'config:resolved')) {
    const hook = normalizeHook(entry.value, 'config:resolved')
    const next = await hook.handler({ config: current, path, dependencies, utils: configResolvedUtils })
    if (next !== undefined) {
      if (!isPlainObject(next)) {
        throw new PandaError('CONFIG_ERROR', '💥 config:resolved hook must return a config object or undefined.')
      }
      current = next as UserConfig
    }
  }

  return current
}

const configResolvedUtils = {
  omit<T extends object>(obj: T, paths: string[]): T {
    const clone = cloneValue(obj)
    for (const path of paths) {
      deleteAtPath(clone, path)
    }
    return clone
  },
  pick<T extends object>(obj: T, paths: string[]): Partial<T> {
    const result: Record<string, unknown> = {}
    for (const path of paths) {
      const value = getAtPath(obj, path)
      if (value !== undefined) {
        setAtPath(result, path, value)
      }
    }
    return result as Partial<T>
  },
  traverse(obj: unknown, callback: (item: TraverseItem) => void, options: TraverseOptions = {}): void {
    traverseValue(obj, callback, options)
  },
}

interface TraverseItem {
  value: unknown
  path: string
  depth: number
  parent: unknown[] | Record<string, unknown>
  key: string
}

interface TraverseOptions {
  separator?: string | undefined
  maxDepth?: number | undefined
}

function cloneValue<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => cloneValue(item)) as T
  if (!isPlainObject(value)) return value

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, child]) => [key, cloneValue(child)]),
  ) as T
}

function pathParts(path: string) {
  return path.split('.').filter(Boolean)
}

function getAtPath(value: unknown, path: string): unknown {
  let current = value
  for (const part of pathParts(path)) {
    if (!isPlainObject(current) && !Array.isArray(current)) return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

function setAtPath(target: Record<string, unknown>, path: string, value: unknown): void {
  const parts = pathParts(path)
  let current = target

  parts.forEach((part, index) => {
    if (index === parts.length - 1) {
      current[part] = cloneValue(value)
      return
    }

    const next = current[part]
    if (!isPlainObject(next)) {
      current[part] = {}
    }
    current = current[part] as Record<string, unknown>
  })
}

function deleteAtPath(target: unknown, path: string): void {
  const parts = pathParts(path)
  const key = parts.pop()
  if (!key) return

  let current = target
  for (const part of parts) {
    if (!isPlainObject(current) && !Array.isArray(current)) return
    current = (current as Record<string, unknown>)[part]
  }

  if (isPlainObject(current) || Array.isArray(current)) {
    delete (current as Record<string, unknown>)[key]
  }
}

function traverseValue(
  value: unknown,
  callback: (item: TraverseItem) => void,
  options: TraverseOptions,
  parent?: unknown[] | Record<string, unknown>,
  key?: string,
  path = '',
  depth = 0,
): void {
  if (parent && key !== undefined) {
    callback({ value, path, depth, parent, key })
  }
  if (options.maxDepth !== undefined && depth >= options.maxDepth) return
  if (!isPlainObject(value) && !Array.isArray(value)) return

  const separator = options.separator ?? '.'
  const container = value as unknown[] | Record<string, unknown>
  Object.entries(value as Record<string, unknown>).forEach(([childKey, child]) => {
    traverseValue(child, callback, options, container, childKey, joinPath(path, childKey, separator), depth + 1)
  })
}

function joinPath(parent: string, key: string, separator: string) {
  return parent ? `${parent}${separator}${key}` : key
}
