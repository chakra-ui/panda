import type {
  Compiler,
  CompileOutput,
  Diagnostic,
  ExtractedCall,
  ExtractedJsx,
  ExtractResult,
  MatchCategory,
  SerializedConfig,
  Span,
} from '@pandacss/compiler-shared'

export interface CompileInput {
  files?: Array<{ path: string; content: string }>
  config?: SerializedConfig
  cwd?: string
  cacheDir?: string
}

export type ImportSpecifierKind = 'named' | 'default' | 'namespace'

export interface ImportSpecifier {
  kind: ImportSpecifierKind
  imported: string
  local: string
  typeOnly: boolean
  span: Span
}

export type ImportKind = 'sideEffect' | 'value'

export interface ImportRecord {
  module: string
  kind: ImportKind
  typeOnly: boolean
  specifiers: ImportSpecifier[]
  span: Span
}

export interface ImportScanResult {
  imports: ImportRecord[]
  diagnostics: Diagnostic[]
}

export interface Matcher {
  modules: string[]
  /** Omit to match any imported name (used for recipes/patterns). */
  names?: string[]
}

export interface Matchers {
  css: Matcher
  recipe: Matcher
  pattern: Matcher
  jsx?: Matcher
  tokens: Matcher
  /** Resolved Panda token dictionary. When present, `token('path')` and
   *  `token.var('path')` calls fold to their dictionary value during
   *  extraction. */
  tokenDictionary?: TokenDictionary
  /** JSX factory names that accept member-chain tags (`<styled.div>`).
   *  Omit to use the built-in default `["styled"]`; provide an array to
   *  override (replaces the default outright — not additive). */
  jsxFactories?: string[]
}

/** Two parallel `path → string` maps backing `token()` resolution.
 *  - `values['colors.red.500']` → raw value, e.g. `'#ef4444'`
 *  - `vars['colors.red.500']` → CSS-var form, e.g. `'var(--colors-red-500)'` */
export interface TokenDictionary {
  values: Record<string, string>
  vars: Record<string, string>
}

export interface MatchedImport {
  category: MatchCategory
  module: string
  name: string
  alias: string
  kind: ImportSpecifierKind
}

export interface ExtractedCallsResult {
  calls: ExtractedCall[]
  diagnostics: Diagnostic[]
}

export interface ExtractedJsxResult {
  jsx: ExtractedJsx[]
  diagnostics: Diagnostic[]
}

/** Full result including raw + matched imports, for tooling / parity flows. */
export interface ExtractDebugResult {
  imports: ImportRecord[]
  matched: MatchedImport[]
  calls: ExtractedCall[]
  jsx: ExtractedJsx[]
  diagnostics: Diagnostic[]
}

/** Reusable extractor session — built once from a `Matchers` config, then
 *  called per file. For one-off use, prefer a `Compiler` + `extractFileSource`. */
export interface ExtractorSession {
  extract(path: string, source: string): ExtractResult
  extractDebug(path: string, source: string): ExtractDebugResult
  matchImports(scan: ImportScanResult): MatchedImport[]
}

export interface ExtractorSessionConstructor {
  new (matchers: Matchers): ExtractorSession
}

export interface TraceOptions {
  /** Tracing filter, e.g. "trace", "debug", or "pandacss_project=trace". */
  filter?: string
  /** `fmt` writes to stderr; `chrome-json` writes a Chrome trace file. */
  output?: 'fmt' | 'chrome-json'
  /** Required for useful `chrome-json` output. Defaults to `.panda/trace.json`. */
  file?: string
}

export interface NativeCompilerOptions {
  crossFile?: boolean
}

/** The raw native instance — superset of {@link Compiler} carrying the internal
 *  methods the facade hides. */
export interface RawCompiler extends Compiler {
  token_dictionary?(): TokenDictionary | undefined
  registerUtilityTransform?(id: string, callback: (value: unknown) => unknown): void
  registerPatternTransform?(id: string, callback: (props: unknown, helpers: Record<string, unknown>) => unknown): void
}

export interface CompilerConstructor {
  fromConfig(
    config: SerializedConfig,
    options?: NativeCompilerOptions,
    utilityValuesCallbacks?: Record<string, (tokenDictionary: TokenDictionary | undefined) => unknown>,
  ): RawCompiler
}

export interface NativeBinding {
  startTracing?(options?: TraceOptions): boolean
  flushTracing?(): void
  shutdownTracing?(): boolean
  compile(input?: CompileInput): CompileOutput
  scanImports(path: string, source: string): ImportScanResult
  matchImports(scan: ImportScanResult, matchers: Matchers): MatchedImport[]
  extractCalls(path: string, source: string, matched: MatchedImport[], matchers: Matchers): ExtractedCallsResult
  extractJsx(path: string, source: string, matched: MatchedImport[], matchers: Matchers): ExtractedJsxResult
  extract(path: string, source: string, matchers: Matchers): ExtractResult
  extractDebug(path: string, source: string, matchers: Matchers): ExtractDebugResult
  Extractor: ExtractorSessionConstructor
  Compiler: CompilerConstructor
}
