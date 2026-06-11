import type { Config } from './config'

type MaybeAsyncReturn<T = void> = Promise<T> | T

export type HookFilterPattern =
  | string
  | RegExp
  | {
      include?: Array<string | RegExp> | undefined
      exclude?: Array<string | RegExp> | undefined
    }

export interface HookFilter {
  id?: HookFilterPattern | undefined
  code?:
    | {
        include?: string | RegExp | undefined
        exclude?: string | RegExp | undefined
      }
    | undefined
}

type HookHandler = (...args: never[]) => unknown

export type PandaHook<Handler extends HookHandler> = Handler | { filter?: HookFilter; handler: Handler }

export interface ParserResultBeforeHookArgs {
  filePath: string
  content: string
  original?: string
}

export interface PresetResolvedHookArgs {
  preset: Config
  name: string
}

interface TraverseItem {
  value: unknown
  path: string
  depth: number
  parent: unknown[] | Record<string, unknown>
  key: string
}

interface TraverseOptions {
  separator?: string | undefined
  maxDepth?: number | undefined
}

export interface ConfigResolvedHookUtils {
  omit<T extends object>(obj: T, paths: string[]): T
  pick<T extends object>(obj: T, paths: string[]): Partial<T>
  traverse(obj: unknown, callback: (item: TraverseItem) => void, options?: TraverseOptions): void
}

export interface ConfigResolvedHookArgs {
  config: Config
  path: string
  dependencies: string[]
  utils: ConfigResolvedHookUtils
}

export interface CodegenFile {
  path: string
  code: string
  dependencies: string[]
}

export interface CodegenArtifact {
  id: string
  files: CodegenFile[]
}

export interface CodegenPrepareHookArgs {
  artifacts: CodegenArtifact[]
  outdir: string
  cwd?: string | undefined
}

export interface CodegenDoneHookArgs {
  files: string[]
  outdir: string
  cwd?: string | undefined
}

export interface PandaHooks {
  /**
   * Called after authored presets are merged, before defaults and serialization.
   */
  'config:resolved': (args: ConfigResolvedHookArgs) => MaybeAsyncReturn<void | Config>
  /**
   * Called when an authored preset is resolved, before all configs are merged.
   */
  'preset:resolved': (args: PresetResolvedHookArgs) => MaybeAsyncReturn<void | Config>
  /**
   * Called after reading file content but before parsing it.
   * Use this to transform non-standard source into TSX-friendly syntax.
   */
  'parser:before': (args: ParserResultBeforeHookArgs) => MaybeAsyncReturn<string | void>
  /**
   * Called before generated files are written by a JS host.
   */
  'codegen:prepare': (args: CodegenPrepareHookArgs) => void | CodegenArtifact[]
  /**
   * Called after generated files are written by a JS host.
   */
  'codegen:done': (args: CodegenDoneHookArgs) => void
}

export type HookRegistry = {
  [Name in keyof PandaHooks]: PandaHook<PandaHooks[Name]>
}
