import type { Compiler, CompilerOptions } from '@pandacss/compiler-shared'
import { type LoadConfigOptions, type LoadedPandaConfig, loadPandaConfig } from '@pandacss/config-loader'
import { createCompilerFromSnapshot } from './index'

export type { LoadConfigOptions, LoadedPandaConfig } from '@pandacss/config-loader'

export interface LoadCompilerResult {
  /** The compiler built from the loaded config snapshot. */
  compiler: Compiler
  /** Resolved config path. */
  path: string
  /** Module ids to watch for invalidation. */
  dependencies: string[]
}

/**
 * Node-only convenience: load a user's `panda.config.{ts,js,…}` from disk and
 * build a compiler from it. Bundles + serializes the config via
 * `@pandacss/config-loader`, then feeds the snapshot to
 * {@link createCompilerFromSnapshot} (live `transform` callbacks included).
 *
 * Pulls in Rolldown, so it lives on the `@pandacss/compiler/loader` subpath to
 * keep the core entry dependency-light.
 */
export async function loadCompiler(
  options: LoadConfigOptions,
  compilerOptions?: CompilerOptions,
): Promise<LoadCompilerResult> {
  const loaded: LoadedPandaConfig = await loadPandaConfig(options)
  const compiler = createCompilerFromSnapshot({ config: loaded.config, callbacks: loaded.callbacks }, compilerOptions)
  return { compiler, path: loaded.path, dependencies: loaded.dependencies }
}
