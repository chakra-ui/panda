import type { Config, UserConfig } from '@pandacss/types'
import { bundle } from './bundle'
import { PandaError } from './error'
import { findConfig } from './find'
import { createConfigSnapshot } from './serialize'
import type { LoadConfigOptions, LoadedPandaConfig } from './types'

/**
 * Load and serialize a user's Panda config into a compiler-ready snapshot.
 * Bundles in memory (Rolldown + `data:` URL), then lowers functions to callback
 * refs and captures pattern transform source. The result feeds
 * `createCompilerFromSnapshot({ config, callbacks })`.
 *
 * Preset and hook resolution are intentionally out of scope for now.
 */
export async function loadPandaConfig(options: LoadConfigOptions): Promise<LoadedPandaConfig> {
  const { cwd, file } = options

  const path = findConfig({ cwd, file })

  const { config, dependencies } = await bundle<Config>(path, cwd)

  if (typeof config !== 'object') {
    throw new PandaError('CONFIG_ERROR', '💥 Config must export or return an object.')
  }

  config.outdir ??= 'styled-system'
  config.validation ??= 'warn'

  // Explicit `config.dependencies` escape hatch, on top of bundled module ids.
  const dependencyList = Array.from(new Set([...dependencies, ...(config.dependencies ?? [])]))

  const snapshot = createConfigSnapshot(config as UserConfig)

  return {
    path,
    config: snapshot.config,
    callbacks: snapshot.callbacks,
    dependencies: dependencyList,
  }
}
