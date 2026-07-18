import type { ParserResultBeforeHookArgs, PatternHelpers, TransformArgs } from '@pandacss/types'

/**
 * JSON-safe, resolved Panda config consumed by the compiler.
 * Function-valued options are lowered to callback refs, with live callbacks
 * supplied through `CompilerOptions.callbacks`.
 */
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

/**
 * Serialized config paired with the live callbacks and hooks that cannot cross JSON.
 */
export interface ConfigSnapshot {
  config: SerializedConfig
  callbacks?: ProjectCallbacks
  hooks?: ProjectHooks
}

export interface CompilerOptions {
  /**
   * Defaults to true; enables token/import folding across files.
   */
  crossFile?: boolean
  callbacks?: ProjectCallbacks
  hooks?: ProjectHooks
}

export type UtilityValuesTheme = (category: string) => Record<string, string> | undefined
export type UtilityValuesCallback = (theme: UtilityValuesTheme) => Record<string, string> | string[] | undefined
export type UtilityTransformCallback = (value: string, args: TransformArgs) => unknown
export type PatternTransformCallback = (props: Record<string, any>, helpers: PatternHelpers) => unknown
export type PatternDefaultValuesCallback = (props: Record<string, any>) => unknown

export type SourceTransformCallback = (args: ParserResultBeforeHookArgs) => string | void

export interface ProjectCallbackMap {
  'utility.transform': Record<string, UtilityTransformCallback>
  'utility.values': Record<string, UtilityValuesCallback>
  'pattern.transform': Record<string, PatternTransformCallback>
  'pattern.defaultValues': Record<string, PatternDefaultValuesCallback>
  'parser:before': Record<string, SourceTransformCallback>
}

export type ProjectCallbacks = Partial<ProjectCallbackMap>
