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

export interface Diagnostic {
  message: string
  severity: DiagnosticSeverity
  span?: Span
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
  /** Literal-extractable arguments in source order. Non-extractable args
   * are omitted, so positional alignment with the call is not preserved. */
  data: unknown[]
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

export interface ExtractResult {
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

export function getBindingInfo() {
  return {
    native: binding !== fallback,
  }
}
