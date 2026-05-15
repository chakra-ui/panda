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
  /** One entry per source argument, in order. `null` marks an argument that
   * was present but not literal-extractable (identifier, conditional, etc.).
   * `data.length` always matches the source arity. */
  data: Array<unknown | null>
  span: Span
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

export interface NativeBinding {
  compile(input?: CompileInput): CompileOutput
  scanImports(source: string, path: string): ImportScanResult
  matchImports(scan: ImportScanResult, matchers: Matchers): MatchedImport[]
  extractCalls(source: string, path: string, matched: MatchedImport[], matchers: Matchers): ExtractedCallsResult
  extractJsx(source: string, path: string, matched: MatchedImport[], matchers: Matchers): ExtractedJsxResult
  extract(source: string, path: string, matchers: Matchers): ExtractResult
  extractDebug(source: string, path: string, matchers: Matchers): ExtractDebugResult
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
}

const binding = loadNativeBinding() ?? fallback

export function compile(input: CompileInput = {}): CompileOutput {
  return binding.compile(input)
}

export function scanImports(source: string, path: string): ImportScanResult {
  return binding.scanImports(source, path)
}

export function matchImports(scan: ImportScanResult, matchers: Matchers): MatchedImport[] {
  return binding.matchImports(scan, matchers)
}

export function extractCalls(
  source: string,
  path: string,
  matched: MatchedImport[],
  matchers: Matchers,
): ExtractedCallsResult {
  return binding.extractCalls(source, path, matched, matchers)
}

export function extractJsx(
  source: string,
  path: string,
  matched: MatchedImport[],
  matchers: Matchers,
): ExtractedJsxResult {
  return binding.extractJsx(source, path, matched, matchers)
}

export function extract(source: string, path: string, matchers: Matchers): ExtractResult {
  return binding.extract(source, path, matchers)
}

export function extractDebug(source: string, path: string, matchers: Matchers): ExtractDebugResult {
  return binding.extractDebug(source, path, matchers)
}

export function getBindingInfo() {
  return {
    native: binding !== fallback,
  }
}
