/**
 * TS-facing types that mirror the wasm-bindgen generated interfaces.
 * Kept hand-written (rather than re-exporting from `../pkg-node/*`) so
 * `tsc` typechecks succeed before the wasm artifact is built.
 *
 * Run `pnpm build:wasm` to (re)generate the actual wasm bundle.
 */

export interface MatcherInput {
  /** Module specifier substrings to match (e.g. `["@panda/css"]`). */
  modules: string[]
  /**
   * Allowed imported names. Omit (or pass `null`) to accept any name —
   * used for recipe/pattern matchers where names are user-defined.
   */
  names?: string[] | null
}

export interface TokenDictionaryInput {
  /** `path → raw value` (e.g. `colors.red.500 → #ef4444`). */
  values: Record<string, string>
  /** `path → CSS var form` (e.g. `colors.red.500 → var(--colors-red-500)`). */
  vars: Record<string, string>
}

export interface MatchersInput {
  css?: MatcherInput
  recipe?: MatcherInput
  pattern?: MatcherInput
  jsx?: MatcherInput
  tokens?: MatcherInput
  /** Defaults to `["styled"]` when omitted. */
  jsxFactories?: string[]
  /** Enable `token('…')` folding by passing a resolved dictionary. */
  tokenDictionary?: TokenDictionaryInput
}

export interface GlobOptions {
  include: string[]
  exclude?: string[]
  cwd?: string
  absolute?: boolean
}

export declare class WasmFileSystem {
  constructor()
  addFile(path: string, content: string): void
  removeFile(path: string): boolean
  readFile(path: string): string | undefined
  exists(path: string): boolean
  glob(opts: GlobOptions): string[]
  fileCount(): number
}

export declare class WasmExtractor {
  constructor(fs: WasmFileSystem, matchers: MatchersInput)
  parseFile(path: string, source: string): unknown
}

/** One atomic style declaration: `(prop, value, conditions)`. */
export interface Atom {
  prop: string
  value: string | number | boolean | null
  conditions: string[]
}

/** `(file, spanStart, recipe)` entry. The `recipe` matches the
 *  serialized shape of `pandacss_recipes::Recipe` / `SlotRecipe`. */
export interface RecipeEntry {
  file: string
  spanStart: number
  recipe: unknown
}

export interface EncodedRecipeStyles {
  base: RecipeStyleGroup[]
  variants: RecipeStyleGroup[]
  atomic: Atom[]
}

export interface RecipeStyleGroup {
  recipe: string
  slot?: string | null
  className: string
  entries: RecipeStyleEntry[]
}

export interface RecipeStyleEntry {
  prop: string
  value: string | number | boolean | null
  conditions: string[]
}

export interface ParseFileReport {
  cssCalls: number
  cvaCalls: number
  svaCalls: number
  jsxUsages: number
  diagnostics: unknown[]
}

export interface ProjectSummary {
  filesProcessed: number
  atomCount: number
  recipeCount: number
  slotRecipeCount: number
}

export type WasmProjectCallbackKind =
  | 'utility.transform'
  | 'utility.values'
  | 'pattern.transform'
  | 'pattern.defaultValues'

export type WasmProjectCallbacks = Partial<Record<WasmProjectCallbackKind, Record<string, (...args: any[]) => unknown>>>

export interface WasmConfigSnapshot {
  config: Record<string, unknown>
  callbacks?: WasmProjectCallbacks
}

export interface WasmProjectOptions {
  /** Serialized config snapshot used to resolve callback ids to utility props. */
  config?: Record<string, unknown>
  /** Optional JS-side token helpers for callback execution. */
  tokenDictionary?: TokenDictionaryInput
  /** Browser/JS-host callbacks referenced by serialized config entries. */
  callbacks?: WasmProjectCallbacks
}

export interface Diagnostic {
  code: string
  message: string
  severity: 'info' | 'warning' | 'error'
  span?: { start: number; end: number }
  location?: {
    start: { line: number; column: number }
    end: { line: number; column: number }
  }
}

export interface CompileFileManifest {
  path: string
  hash: string
}

export interface CompileManifest {
  files: CompileFileManifest[]
  tokens: string[]
}

export interface CompileLayerRange {
  start: number
  end: number
}

export interface CompileLayerRanges {
  reset?: CompileLayerRange
  base?: CompileLayerRange
  tokens?: CompileLayerRange
  recipes?: CompileLayerRange
  utilities?: CompileLayerRange
}

export interface CompileOutput {
  css: string
  sourceMap?: string
  manifest: CompileManifest
  layerRanges: CompileLayerRanges
  diagnostics: Diagnostic[]
}

export interface ParsedFileView {
  path: string
  atoms: Atom[]
  diagnostics: Diagnostic[]
  recipes: RecipeEntry[]
  slotRecipes: RecipeEntry[]
}

export interface StaticPatternResult {
  atoms: Atom[]
  diagnostics: Diagnostic[]
}

/** Stateful project handle over a `WasmFileSystem`. Cross-file
 *  resolution always shares the same FS — `import { x } from './tokens'`
 *  references resolve through whatever the JS host has populated. */
export declare class WasmProject {
  constructor(fs: WasmFileSystem, matchers: MatchersInput, options?: WasmProjectOptions)
  static fromConfig(fs: WasmFileSystem, config: Record<string, unknown>, options?: WasmProjectOptions): WasmProject
  config(): Record<string, unknown> | null
  extract(source: string, path: string): unknown
  parseFile(path: string, source: string): ParseFileReport
  refreshFile(path: string, source: string): boolean
  removeFile(path: string): boolean
  clear(): void
  isEmpty(): boolean
  registerUtilityTransform?(id: string, callback: (value: unknown) => unknown): void
  registerPatternTransform?(id: string, callback: (props: unknown, helpers: Record<string, unknown>) => unknown): void
  atoms(): Atom[]
  recipes(): RecipeEntry[]
  slotRecipes(): RecipeEntry[]
  encodedRecipes(): EncodedRecipeStyles
  summary(): ProjectSummary
  compile(): CompileOutput
  diagnostics(): Diagnostic[]
  fileManifest(): CompileFileManifest[]
  /** Per-file view, or `null` when `path` isn't known. */
  getFile(path: string): ParsedFileView | null
  staticPatternAtoms(): StaticPatternResult
}
