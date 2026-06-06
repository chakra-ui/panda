import { applyConfigDefaults } from '@pandacss/compiler-shared'
import type { Config, UserConfig } from '@pandacss/types'
import { bundle } from './bundle'
import { PandaError } from './error'
import { findConfig } from './find'
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
 * Authored presets are resolved before defaults are applied; automatic preset
 * injection and config hooks are intentionally out of scope for now.
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
  const authored = await resolveAuthoredPresets(config as UserConfig, cwd)
  const resolved = applyConfigDefaults(authored.config, cwd) as UserConfig

  // Explicit `config.dependencies` escape hatch, on top of bundled module ids.
  const dependencyList = Array.from(
    new Set([...dependencies, ...authored.dependencies, ...(resolved.dependencies ?? [])]),
  )

  const snapshot = createConfigSnapshot(resolved)

  return {
    path,
    config: snapshot.config,
    callbacks: snapshot.callbacks,
    dependencies: dependencyList,
  }
}
