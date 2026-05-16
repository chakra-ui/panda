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
