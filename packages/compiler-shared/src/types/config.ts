import type { ProjectCallbacks } from './callbacks'

/** Author import map (`ImportMapInput`). */
export interface ImportMapInput {
  css?: string | string[]
  recipe?: string | string[]
  recipes?: string | string[]
  pattern?: string | string[]
  patterns?: string | string[]
  jsx?: string | string[]
  tokens?: string | string[]
}

/** Normalized import map for snapshots and Rust. */
export interface ImportMapOutput {
  css: string[]
  recipe: string[]
  pattern: string[]
  jsx: string[]
  tokens: string[]
}

/** Styled-system root string or per-category object. */
export type ImportMapOption = string | ImportMapInput

/** JSON-safe, fully-resolved Panda config the compiler consumes.
 *
 *  Intentionally opaque: function-valued options (`utilities.*.transform`, …)
 *  are already lowered to `{ kind: 'js-callback', id }` refs, with the live
 *  functions supplied via {@link CompilerOptions.callbacks}. `@pandacss/config`
 *  produces values conforming to this; the compiler never imports config.
 *  `importMap` is expanded to {@link ImportMapOutput} before Rust. */
export type SerializedConfig = Record<string, unknown>

export interface SerializedRegex {
  kind: 'regex'
  source: string
  flags?: string
}

export type SerializedHookPattern =
  | string
  | SerializedRegex
  | {
      include?: Array<string | SerializedRegex>
      exclude?: Array<string | SerializedRegex>
    }

export interface SerializedHookFilter {
  id?: SerializedHookPattern
  code?: {
    include?: string | SerializedRegex
    exclude?: string | SerializedRegex
  }
}

export interface SerializedSourceTransformHook {
  id: string
  name?: string
  filter?: SerializedHookFilter
  hash: string
}

export interface ProjectHooks {
  'parser:before'?: SerializedSourceTransformHook[]
}

export type ProjectCallbackKind =
  | 'utility.transform'
  | 'utility.values'
  | 'pattern.transform'
  | 'pattern.defaultValues'
  | 'parser:before'

/** Serialized config paired with its live callbacks, as produced by the host's
 *  `createConfigSnapshot`. */
export interface ConfigSnapshot {
  config: SerializedConfig
  callbacks?: ProjectCallbacks
  hooks?: ProjectHooks
}

export interface CompilerOptions {
  /** Defaults to `true`; lets `token('…')` and `import { x } from './tokens'` fold. */
  crossFile?: boolean
  callbacks?: ProjectCallbacks
  hooks?: ProjectHooks
}
