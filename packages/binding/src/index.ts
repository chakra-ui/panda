import { loadNativeBinding } from './load-binary'
import {
  assertProjectCallbacks,
  registerCallbacks,
  resolveUtilityValueCallbacks,
  wrapProjectCallbacks,
} from './callbacks'
export type { ColorMixResult, PatternHelpers, RawToken, TransformArgs } from './callbacks'

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
  /** JSX factory names that accept member-chain tags (`<styled.div>`).
   *  Omit to use the built-in default `["styled"]`; provide an array to
   *  override (replaces the default outright — not additive). */
  jsxFactories?: string[]
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

// --- Project (stateful) ---

/** One atomic style declaration: `(prop, value, conditions)`. Returned
 *  by `Project.atoms()`. Conditions are outer→inner; an unconditional
 *  atom has an empty array. */
export interface Atom {
  prop: string
  value: string | number | boolean | null
  conditions: string[]
}

/** One `(file, spanStart, recipe)` entry from `Project.recipes()` /
 *  `slotRecipes()`. The `recipe` value is the serialized shape of
 *  `pandacss_recipes::Recipe` / `SlotRecipe`. */
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

/** Per-call telemetry returned by `Project.parseFile()`. */
export interface ParseFileReport {
  cssCalls: number
  cvaCalls: number
  svaCalls: number
  jsxUsages: number
  diagnostics: Diagnostic[]
}

/** Aggregate counts across the project. Returned by `Project.summary()`. */
export interface ProjectSummary {
  filesProcessed: number
  atomCount: number
  recipeCount: number
  slotRecipeCount: number
}

/** Optional construction inputs. `crossFile` defaults to `true` — the
 *  resolver is cheap if no imports get followed and lets `token('…')`
 *  and `import { x } from './tokens'` references fold. */
export interface ProjectOptions {
  crossFile?: boolean
  /** Optional JS-side token helpers for callback execution. The Rust
   *  project builds its own dictionary from `UserConfig`; this only
   *  feeds JS `utility.values` / `utility.transform` callbacks. */
  tokenDictionary?: TokenDictionary
  callbacks?: ProjectCallbacks
}

export type ProjectCallbackKind = 'utility.transform' | 'utility.values' | 'pattern.transform' | 'pattern.defaultValues'

export type ProjectCallbacks = Partial<Record<ProjectCallbackKind, Record<string, (...args: any[]) => unknown>>>

export type UserConfig = Record<string, unknown>

export interface ConfigSnapshot {
  config: UserConfig
  callbacks?: ProjectCallbacks
}

/** Stateful project orchestration. Holds a per-file atom registry,
 *  drops a file's contribution on `removeFile` / `refreshFile`, and
 *  runs the encoder over every extracted style so callers see `Atom[]`
 *  directly. For raw `ExtractedCall` / `ExtractedJsx` records (linting,
 *  parity testing), use `Extractor` instead. */
export interface ProjectInstance {
  config(): UserConfig | null
  registerUtilityTransform?(id: string, callback: (value: unknown) => unknown): void
  registerPatternTransform?(id: string, callback: (props: unknown, helpers: Record<string, unknown>) => unknown): void
  parseFile(path: string, source: string): ParseFileReport
  /** Re-parse `path` *only if* already known. Returns `true` when the
   *  file was present. Filter watch events through this to ignore
   *  changes in unrelated paths. */
  refreshFile(path: string, source: string): boolean
  removeFile(path: string): boolean
  clear(): void
  isEmpty(): boolean
  atoms(): Atom[]
  recipes(): RecipeEntry[]
  slotRecipes(): RecipeEntry[]
  encodedRecipes(): EncodedRecipeStyles
  summary(): ProjectSummary
}

export interface ProjectConstructor {
  fromConfig(config: UserConfig | ConfigSnapshot, options?: ProjectOptions): ProjectInstance
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
  /** Stateful project orchestration. See `ProjectInstance`. */
  Project: ProjectConstructor
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

class FallbackProject implements ProjectInstance {
  static fromConfig() {
    return new FallbackProject()
  }
  config() {
    return null
  }
  parseFile() {
    return { cssCalls: 0, cvaCalls: 0, svaCalls: 0, jsxUsages: 0, diagnostics: [] }
  }
  refreshFile() {
    return false
  }
  removeFile() {
    return false
  }
  clear() {
    /* no-op */
  }
  isEmpty() {
    return true
  }
  atoms() {
    return [] as Atom[]
  }
  recipes() {
    return [] as RecipeEntry[]
  }
  slotRecipes() {
    return [] as RecipeEntry[]
  }
  encodedRecipes() {
    return { base: [], variants: [], atomic: [] } as EncodedRecipeStyles
  }
  summary() {
    return { filesProcessed: 0, atomCount: 0, recipeCount: 0, slotRecipeCount: 0 }
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
  Project: FallbackProject as unknown as ProjectConstructor,
}

const binding = loadNativeBinding() ?? fallback
const nativeProjectFromConfig =
  'fromConfig' in binding.Project && typeof binding.Project.fromConfig === 'function'
    ? binding.Project.fromConfig.bind(binding.Project)
    : undefined

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

export const Project = {
  fromConfig(configOrSnapshot: UserConfig | ConfigSnapshot, options?: ProjectOptions) {
    const { config, callbacks } = normalizeProjectConfigInput(configOrSnapshot, options)
    const nativeOptions = stripProjectCallbacks(options)
    const tokenDictionary = options?.tokenDictionary
    assertProjectCallbacks(config, callbacks)
    const resolvedConfig = resolveUtilityValueCallbacks(config, callbacks, tokenDictionary)
    if (nativeProjectFromConfig) {
      const project = nativeProjectFromConfig(resolvedConfig, nativeOptions)
      if (registerCallbacks(project, callbacks, tokenDictionary)) return project
      return wrapProjectCallbacks(project, callbacks, tokenDictionary)
    }
    throw new Error('Project.fromConfig is not available in this binding')
  },
} satisfies ProjectConstructor

export function getBindingInfo() {
  return {
    native: binding !== fallback,
  }
}

function normalizeProjectConfigInput(
  input: UserConfig | ConfigSnapshot,
  options?: ProjectOptions,
): { config: UserConfig; callbacks: ProjectCallbacks } {
  if (isConfigSnapshot(input)) {
    return {
      config: input.config,
      callbacks: mergeCallbacks(input.callbacks, options?.callbacks),
    }
  }

  return {
    config: input,
    callbacks: options?.callbacks ?? {},
  }
}

function isConfigSnapshot(input: UserConfig | ConfigSnapshot): input is ConfigSnapshot {
  return !!input.config && typeof input.config === 'object' && !Array.isArray(input.config)
}

function stripProjectCallbacks(options: ProjectOptions | undefined): ProjectOptions | undefined {
  if (!options) return undefined
  const { callbacks: _callbacks, tokenDictionary: _tokenDictionary, ...rest } = options
  return rest
}

function mergeCallbacks(...items: Array<ProjectCallbacks | undefined>): ProjectCallbacks {
  const result: ProjectCallbacks = {}
  for (const item of items) {
    for (const [kind, callbacks] of Object.entries(item ?? {}) as Array<
      [ProjectCallbackKind, Record<string, Function>]
    >) {
      result[kind] = { ...result[kind], ...callbacks } as Record<string, (...args: any[]) => unknown>
    }
  }
  return result
}
