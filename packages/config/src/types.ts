import type { ProjectCallbacks, ProjectHooks, SerializedConfig } from '@pandacss/compiler-shared'
import type { HostHooks } from './hooks'
import type { ResolvedDesignSystem } from './design-system'
import type { ConfigSources } from './sources'

export interface LoadConfigOptions {
  cwd: string
  /** Explicit config file path (relative to `cwd`); otherwise discovered upward. */
  file?: string
  /** Track which authored config or preset contributed resolved config entries. */
  trackSources?: boolean
}

export interface LoadConfigResult {
  /** Absolute path to the resolved config file. */
  path: string
  /** JSON-safe, callback-lowered config; patterns carry `codegenSource`. */
  config: SerializedConfig
  /** Live utility/pattern transform callbacks, paired with `config`. */
  callbacks: ProjectCallbacks
  /** JSON-safe hot-path hook metadata paired with live callbacks. */
  hooks?: ProjectHooks
  /** Live JS host hooks that do not cross into Rust. */
  hostHooks?: HostHooks
  /** Module ids the config depends on, for watch-mode invalidation. */
  dependencies: string[]
  metadata?: {
    sources?: ConfigSources
    designSystem?: ResolvedDesignSystem[]
    userTokenPaths?: string[]
    userRecipeNames?: string[]
    userPatternNames?: string[]
  }
}
