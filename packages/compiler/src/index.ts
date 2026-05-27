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
export interface CompilerOptions {
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

export interface TraceOptions {
  /** Tracing filter, e.g. "trace", "debug", or "pandacss_project=trace". */
  filter?: string
  /** `fmt` writes to stderr; `chrome-json` writes a Chrome trace file. */
  output?: 'fmt' | 'chrome-json'
  /** Required for useful `chrome-json` output. Defaults to `.panda/trace.json`. */
  file?: string
}

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
  extract(source: string, path: string): ExtractResult
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
  fromConfig(config: UserConfig | ConfigSnapshot, options?: CompilerOptions): ProjectInstance
}

export interface NativeBinding {
  startTracing?(options?: TraceOptions): boolean
  flushTracing?(): void
  shutdownTracing?(): boolean
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
  extract() {
    return { calls: [], jsx: [], diagnostics: [] }
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
  startTracing() {
    return false
  },
  flushTracing() {
    /* no-op */
  },
  shutdownTracing() {
    return false
  },
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

export function startTracing(options?: TraceOptions): boolean {
  return binding.startTracing?.(options) ?? false
}

export function flushTracing(): void {
  binding.flushTracing?.()
}

export function shutdownTracing(): boolean {
  return binding.shutdownTracing?.() ?? false
}

/** A configured compiler instance. `extract` is a stateless peek; `parseFile`
 *  registers into the incremental atom/recipe registry. */
export interface Compiler {
  extract(source: string, path: string): ExtractResult
  parseFile(path: string, source: string): ParseFileReport
  refreshFile(path: string, source: string): boolean
  removeFile(path: string): boolean
  clear(): void
  isEmpty(): boolean
  atoms(): Atom[]
  recipes(): RecipeEntry[]
  slotRecipes(): RecipeEntry[]
  encodedRecipes(): EncodedRecipeStyles
  summary(): ProjectSummary
  config(): UserConfig | null
  /** Placeholder today — empty stylesheet until the emit pipeline lands. */
  compile(): CompileOutput
}

export function createCompiler(config: UserConfig | ConfigSnapshot, options?: CompilerOptions): Compiler {
  const { config: resolved, callbacks } = normalizeProjectConfigInput(config, options)
  const nativeOptions = stripProjectCallbacks(options)
  const tokenDictionary = options?.tokenDictionary
  assertProjectCallbacks(resolved, callbacks)
  const resolvedConfig = resolveUtilityValueCallbacks(resolved, callbacks, tokenDictionary)
  if (!nativeProjectFromConfig) {
    throw new Error('createCompiler is not available in this binding')
  }
  const project = nativeProjectFromConfig(resolvedConfig, nativeOptions)
  const wired = registerCallbacks(project, callbacks, tokenDictionary)
    ? project
    : wrapProjectCallbacks(project, callbacks, tokenDictionary)
  return toCompiler(wired)
}

function toCompiler(project: ProjectInstance): Compiler {
  return {
    extract: (source, path) => project.extract(source, path),
    parseFile: (path, source) => project.parseFile(path, source),
    refreshFile: (path, source) => project.refreshFile(path, source),
    removeFile: (path) => project.removeFile(path),
    clear: () => project.clear(),
    isEmpty: () => project.isEmpty(),
    atoms: () => project.atoms(),
    recipes: () => project.recipes(),
    slotRecipes: () => project.slotRecipes(),
    encodedRecipes: () => project.encodedRecipes(),
    summary: () => project.summary(),
    config: () => project.config(),
    compile: () => binding.compile({}),
  }
}

export function getBindingInfo() {
  return {
    native: binding !== fallback,
  }
}

function normalizeProjectConfigInput(
  input: UserConfig | ConfigSnapshot,
  options?: CompilerOptions,
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

function stripProjectCallbacks(options: CompilerOptions | undefined): CompilerOptions | undefined {
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
