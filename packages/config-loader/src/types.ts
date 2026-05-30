import type { ProjectCallbacks, SerializedConfig } from '@pandacss/compiler-shared'

export interface LoadConfigOptions {
  cwd: string
  /** Explicit config file path (relative to `cwd`); otherwise discovered upward. */
  file?: string
}

export interface LoadedPandaConfig {
  /** Absolute path to the resolved config file. */
  path: string
  /** JSON-safe, callback-lowered config; patterns carry `codegenSource`. */
  config: SerializedConfig
  /** Live utility/pattern transform callbacks, paired with `config`. */
  callbacks: ProjectCallbacks
  /** Module ids the config depends on, for watch-mode invalidation. */
  dependencies: string[]
}
