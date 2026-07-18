import { defaultConfig, type Diagnostic } from '@pandacss/compiler-shared'
import { loadConfig, type LoadConfigResult } from '@pandacss/config'
import { hydrateDesignSystem } from '../design-system'
import { createCompilerFromSnapshot } from '../index'
import type { NativeCompiler } from '../types'

export interface ProjectKey {
  cwd: string
  /** Explicit config file (relative to `cwd`); otherwise discovered upward. */
  configPath?: string
}

export interface Project {
  compiler: NativeCompiler
  configPath: string
  dependencies: string[]
  outdir: string
  /** Non-fatal issues surfaced while hydrating a consumed design-system package. */
  designSystemDiagnostics: Diagnostic[]
  /** Treeshake import fingerprint (watch sync). */
  designSystemTreeshakeKey?: string
}

export function treeshakeDesignSystemEnabled(config: LoadConfigResult['config']): boolean {
  const optimize = config.optimize as { treeshakeDesignSystem?: boolean } | undefined
  return optimize?.treeshakeDesignSystem === true
}

export function createProjectFromLoadedConfig(loaded: LoadConfigResult): Project {
  const compiler = createCompilerFromSnapshot({
    config: loaded.config,
    callbacks: loaded.callbacks,
    hooks: loaded.hooks,
  })
  const hydrated = hydrateDesignSystem(compiler, {
    chain: loaded.metadata?.designSystem,
    consumerTokenPaths: loaded.metadata?.userTokenPaths ?? [],
    treeshake: treeshakeDesignSystemEnabled(loaded.config),
  })
  return {
    compiler,
    configPath: loaded.path,
    dependencies: loaded.dependencies,
    outdir: (loaded.config.outdir as string | undefined) ?? defaultConfig.outdir,
    designSystemDiagnostics: hydrated.diagnostics,
    designSystemTreeshakeKey: hydrated.treeshakeKey,
  }
}

export async function createProjectFromConfig(key: ProjectKey): Promise<Project> {
  const loaded = await loadConfig({ cwd: key.cwd, file: key.configPath })
  return createProjectFromLoadedConfig(loaded)
}
