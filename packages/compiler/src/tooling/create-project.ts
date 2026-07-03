import { defaultConfig, type Compiler, type Diagnostic } from '@pandacss/compiler-shared'
import { loadConfig, type LoadConfigResult } from '@pandacss/config'
import { hydrateDesignSystem } from '../design-system'
import { createCompilerFromSnapshot } from '../index'

export interface ProjectKey {
  cwd: string
  /** Explicit config file (relative to `cwd`); otherwise discovered upward. */
  configPath?: string
}

export interface Project {
  compiler: Compiler
  configPath: string
  dependencies: string[]
  outdir: string
  /** Non-fatal issues surfaced while hydrating a consumed design-system package. */
  designSystemDiagnostics: Diagnostic[]
}

export function createProjectFromLoadedConfig(loaded: LoadConfigResult): Project {
  const compiler = createCompilerFromSnapshot({
    config: loaded.config,
    callbacks: loaded.callbacks,
    hooks: loaded.hooks,
  })
  const designSystemDiagnostics = hydrateDesignSystem(
    compiler,
    loaded.metadata?.designSystem,
    loaded.metadata?.userTokenPaths ?? [],
  )
  return {
    compiler,
    configPath: loaded.path,
    dependencies: loaded.dependencies,
    outdir: (loaded.config.outdir as string | undefined) ?? defaultConfig.outdir,
    designSystemDiagnostics,
  }
}

export async function createProjectFromConfig(key: ProjectKey): Promise<Project> {
  const loaded = await loadConfig({ cwd: key.cwd, file: key.configPath })
  return createProjectFromLoadedConfig(loaded)
}
