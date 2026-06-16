import { applyConfigDefaults } from '@pandacss/compiler-shared'
import type { Config, UserConfig } from '@pandacss/types'
import { bundleConfig } from './bundle'
import { PandaError } from './error'
import { findConfig } from './find'
import { configResolvedUtils } from './hook-utils'
import { collectPluginHookHandlers, normalizeHook } from './hooks'
import { resolveAuthoredPresets } from './preset'
import { createConfigSnapshot } from './serialize'
import { isPlainObject } from './shared'
import type { LoadConfigOptions, LoadConfigResult } from './types'

/**
 * Load and serialize a user's Panda config into a compiler-ready snapshot.
 * Bundles in memory (Rolldown + `data:` URL), then lowers functions to callback
 * refs and captures pattern transform source. The result feeds
 * `createCompilerFromSnapshot({ config, callbacks })`.
 *
 * Authored presets are resolved before defaults are applied; live hooks remain
 * in the JS host and only parser:before metadata crosses into Rust.
 */
export async function loadConfig(options: LoadConfigOptions): Promise<LoadConfigResult> {
  const { cwd, file } = options

  const path = findConfig({ cwd, file })

  const { config, dependencies } = await bundleConfig<Config>(path, cwd)

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
