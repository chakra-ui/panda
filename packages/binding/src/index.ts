import { loadNativeBinding } from './load-binary'

// --- compile (placeholder) ---

export interface CompileInput {
  files?: Array<{ path: string; content: string }>
  config?: Record<string, unknown>
  cwd?: string
  cacheDir?: string
}

export interface CompileManifest {
  hashes: string[]
  tokens: string[]
}

export type DiagnosticSeverity = 'info' | 'warning' | 'error'

/** 1-indexed line, 1-indexed UTF-16 column. Matches what `tsc` and editors
 *  report so error messages line up with the source the user sees. */
export interface SourceLocation {
  line: number
  column: number
}

export interface SourceRange {
  start: SourceLocation
  end: SourceLocation
}

export interface Diagnostic {
  message: string
  severity: DiagnosticSeverity
  /** UTF-8 byte offsets — useful for slicing the source. */
  span?: Span
  /** Human-readable line/column range covering `span`. */
  location?: SourceRange
}

export interface CompileOutput {
  css: string
  sourceMap?: string
  manifest: CompileManifest
  diagnostics: Diagnostic[]
}

// --- scanImports ---

export interface Span {
  start: number
  end: number
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

// --- matchImports ---

export type MatchCategory = 'css' | 'recipe' | 'pattern' | 'jsx' | 'tokens'

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
   *  extraction. Omit to disable token resolution. */
  tokenDictionary?: TokenDictionary
}

/** Two parallel `path → string` maps backing `token()` resolution.
 *  - `values['colors.red.500']` → raw value, e.g. `'#ef4444'`
 *  - `vars['colors.red.500']` → CSS-var form, e.g. `'var(--colors-red-500)'`
 *  The Panda token-dictionary build pipeline lives on the JS side; the
 *  Rust extractor consumes the resolved maps. */
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

// --- extractCalls ---

export interface ExtractedCall {
  category: MatchCategory
  /** Canonical Panda name (e.g. `"css"`, `"cardStyle"`). For namespace
   * callees like `p.css(...)`, this is the property name. */
  name: string
  /** Local binding at the call site. For namespace calls this is the
   * namespace alias (e.g. `"p"` in `p.css(...)`). */
  alias: string
  /** One entry per source argument, in order. Each entry is tagged so a
   * literal `null` argument (`{ kind: 'value', value: null }`) is
   * distinguishable from a non-extractable one (`{ kind: 'missing' }`).
   * `data.length` always matches the source arity. */
  data: ExtractedArg[]
  span: Span
}

/** Tagged shape for one extracted call argument. */
export type ExtractedArg = { kind: 'value'; value: unknown } | { kind: 'missing'; value?: undefined }

/** Alternatives emitted by a ternary (`a ? b : c`) or logical
 *  (`a && b`, `a || b`, `a ?? b`) expression whose deciding side isn't
 *  statically foldable. The downstream encoder treats each branch as
 *  an alternative output applied under different runtime conditions
 *  (atomic-CSS style). Both branches are themselves any extractable
 *  value — strings, numbers, objects, nested conditionals, etc. */
export interface ExtractedConditional {
  kind: 'conditional'
  branches: unknown[]
}

export interface ExtractedCallsResult {
  calls: ExtractedCall[]
  diagnostics: Diagnostic[]
}

// --- extractJsx ---

export interface ExtractedJsx {
  category: MatchCategory
  /** Canonical Panda element name (e.g. `"Box"`, `"styled.div"`). */
  name: string
  /** Local root binding (`"styled"` for `<styled.div>`, `"JSX"` for `<JSX.Stack>`). */
  alias: string
  /** Extracted props as a single object. Non-literal values are skipped;
   * literal `{...spread}` attributes are merged in source order. */
  data: Record<string, unknown>
  span: Span
}

export interface ExtractedJsxResult {
  jsx: ExtractedJsx[]
  diagnostics: Diagnostic[]
}

// --- extract (combined single-parse entrypoint) ---

/** Lean result returned by `extract()` — production hot path. */
export interface ExtractResult {
  calls: ExtractedCall[]
  jsx: ExtractedJsx[]
  diagnostics: Diagnostic[]
}

/** Full result returned by `extractDebug()` — includes raw + matched imports
 *  for tooling, docs, and parity-compare flows. */
export interface ExtractDebugResult {
  imports: ImportRecord[]
  matched: MatchedImport[]
  calls: ExtractedCall[]
  jsx: ExtractedJsx[]
  diagnostics: Diagnostic[]
}

/** Reusable extractor session.
 *
 *  Built once from a `Matchers` config (including the resolved token
 *  dictionary), then called per file. The token dictionary is
 *  materialized at construction time, so each `extract` call skips the
 *  rebuild cost — for batch / build-time extraction this is the
 *  recommended path. The free `extract` / `extractDebug` functions stay
 *  for one-off CLI use and tests. */
export interface ExtractorSession {
  extract(source: string, path: string): ExtractResult
  extractDebug(source: string, path: string): ExtractDebugResult
  matchImports(scan: ImportScanResult): MatchedImport[]
}

export interface ExtractorSessionConstructor {
  new (matchers: Matchers): ExtractorSession
}

export interface NativeBinding {
  compile(input?: CompileInput): CompileOutput
  scanImports(source: string, path: string): ImportScanResult
  matchImports(scan: ImportScanResult, matchers: Matchers): MatchedImport[]
  extractCalls(source: string, path: string, matched: MatchedImport[], matchers: Matchers): ExtractedCallsResult
  extractJsx(source: string, path: string, matched: MatchedImport[], matchers: Matchers): ExtractedJsxResult
  extract(source: string, path: string, matchers: Matchers): ExtractResult
  extractDebug(source: string, path: string, matchers: Matchers): ExtractDebugResult
  /** Native class export. Construct once via `new binding.Extractor(matchers)`
   *  then reuse the instance across files. */
  Extractor: ExtractorSessionConstructor
}

class FallbackExtractor implements ExtractorSession {
  extract() {
    return { calls: [], jsx: [], diagnostics: [] }
  }
  extractDebug() {
    return { imports: [], matched: [], calls: [], jsx: [], diagnostics: [] }
  }
  matchImports() {
    return []
  }
}

const fallback: NativeBinding = {
  compile() {
    return {
      css: '',
      manifest: { hashes: [], tokens: [] },
      diagnostics: [],
    }
  },
  scanImports() {
    return { imports: [], diagnostics: [] }
  },
  matchImports() {
    return []
  },
  extractCalls() {
    return { calls: [], diagnostics: [] }
  },
  extractJsx() {
    return { jsx: [], diagnostics: [] }
  },
  extract() {
    return { calls: [], jsx: [], diagnostics: [] }
  },
  extractDebug() {
    return { imports: [], matched: [], calls: [], jsx: [], diagnostics: [] }
  },
  Extractor: FallbackExtractor as unknown as ExtractorSessionConstructor,
}

const binding = loadNativeBinding() ?? fallback

export function compile(input: CompileInput = {}): CompileOutput {
  return binding.compile(input)
}

/** Parse a single source file and return its import declarations.
 *
 *  Mostly useful for tooling that wants to inspect imports without
 *  running full extraction. For production extraction, prefer
 *  `new Extractor(matchers)` which folds scanning into a single parse. */
export function scanImports(source: string, path: string): ImportScanResult {
  return binding.scanImports(source, path)
}

/** Filter a scan result against Panda import-map rules.
 *
 *  Re-parses internally each call. For batch extraction, build an
 *  `Extractor` and call `session.matchImports(scan)` instead — same
 *  matchers config, no rebuild per file. */
export function matchImports(scan: ImportScanResult, matchers: Matchers): MatchedImport[] {
  return binding.matchImports(scan, matchers)
}

/** Stage-only call extraction. Re-parses and rebuilds the semantic
 *  table on every invocation, so production batch flows should use
 *  `Extractor.extract(...)` instead. Kept for unit tests and one-off
 *  parity comparisons against the JS extractor. */
export function extractCalls(
  source: string,
  path: string,
  matched: MatchedImport[],
  matchers: Matchers,
): ExtractedCallsResult {
  return binding.extractCalls(source, path, matched, matchers)
}

/** Stage-only JSX extraction. Same testing-only intent as
 *  {@link extractCalls}; prefer `Extractor.extract(...)` in production. */
export function extractJsx(
  source: string,
  path: string,
  matched: MatchedImport[],
  matchers: Matchers,
): ExtractedJsxResult {
  return binding.extractJsx(source, path, matched, matchers)
}

/** Single-pass extract for one file. Rebuilds the token dictionary on
 *  every call. For batch / build-time extraction across many files,
 *  prefer `new Extractor(matchers)` and reuse the instance — the
 *  dictionary is materialized once at construction. */
export function extract(source: string, path: string, matchers: Matchers): ExtractResult {
  return binding.extract(source, path, matchers)
}

export function extractDebug(source: string, path: string, matchers: Matchers): ExtractDebugResult {
  return binding.extractDebug(source, path, matchers)
}

/** Build a reusable extractor session. The native class wraps a
 *  prebuilt token dictionary so per-file `extract` calls don't pay the
 *  dictionary-build cost. */
export const Extractor = binding.Extractor

export function getBindingInfo() {
  return {
    native: binding !== fallback,
  }
}
