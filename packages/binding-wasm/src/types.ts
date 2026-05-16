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

export interface FileReport {
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

export interface WasmProjectOptions {
  tokenDictionary?: TokenDictionaryInput
}

/** Stateful project handle over a `WasmFileSystem`. Cross-file
 *  resolution always shares the same FS — `import { x } from './tokens'`
 *  references resolve through whatever the JS host has populated. */
export declare class WasmProject {
  constructor(fs: WasmFileSystem, matchers: MatchersInput, options?: WasmProjectOptions)
  parseFile(path: string, source: string): FileReport
  refreshFile(path: string, source: string): boolean
  removeFile(path: string): boolean
  clear(): void
  atoms(): Atom[]
  recipes(): RecipeEntry[]
  slotRecipes(): RecipeEntry[]
  summary(): ProjectSummary
}
