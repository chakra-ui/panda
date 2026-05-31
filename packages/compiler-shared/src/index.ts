/**
 * Shared contract for the Panda compiler bindings. `@pandacss/compiler`
 * (native) and `@pandacss/compiler-wasm` (browser) both consume it, so the
 * public surface and the callback runtime live in exactly one place.
 */

export * from './callbacks'

export interface Span {
  start: number
  end: number
}

/** 1-indexed line, 1-indexed UTF-16 column — matches `tsc`/editor reporting. */
export interface SourceLocation {
  line: number
  column: number
}

export interface SourceRange {
  start: SourceLocation
  end: SourceLocation
}

export type DiagnosticSeverity = 'info' | 'warning' | 'error'

export interface Diagnostic {
  code: string
  message: string
  severity: DiagnosticSeverity
  /** UTF-8 byte offsets. */
  span?: Span
  location?: SourceRange
}

export type MatchCategory = 'css' | 'recipe' | 'pattern' | 'jsx' | 'tokens'

/** One atomic style declaration. Conditions are outer→inner; unconditional
 *  atoms have an empty array. */
export interface Atom {
  prop: string
  value: string | number | boolean | null
  conditions: string[]
}

/** `recipe` is the serialized shape of `pandacss_recipes::Recipe`/`SlotRecipe`. */
export interface RecipeEntry {
  file: string
  spanStart: number
  recipe: unknown
}

export interface RecipeStyleEntry {
  prop: string
  value: string | number | boolean | null
  conditions: string[]
}

export interface RecipeStyleGroup {
  recipe: string
  slot?: string | null
  className: string
  entries: RecipeStyleEntry[]
}

export interface EncodedRecipeStyles {
  base: RecipeStyleGroup[]
  variants: RecipeStyleGroup[]
  atomic: Atom[]
}

export interface ParseFileReport {
  cssCalls: number
  cvaCalls: number
  svaCalls: number
  jsxUsages: number
  diagnostics: Diagnostic[]
}

export interface ProjectSummary {
  filesProcessed: number
  atomCount: number
  recipeCount: number
  slotRecipeCount: number
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

export type CodegenArtifactId = 'conditions' | 'css-index' | 'cx' | 'helpers' | 'patterns' | 'selectors' | 'types'

export type CodegenDependency =
  | 'codegenFormat'
  | 'conditions'
  | 'hash'
  | 'jsxFactory'
  | 'jsxFramework'
  | 'jsxStyleProps'
  | 'patterns'
  | 'prefix'
  | 'recipes'
  | 'separator'
  | 'syntax'
  | 'themes'
  | 'tokens'
  | 'utilities'

export interface GenerateArtifactOptions {
  specifiers?: 'extensionless' | 'runtime-and-types'
}

/** Glob overrides for `Compiler.glob`/`scan`. Omitted fields fall back to the
 *  config's `include`/`exclude`/`cwd`. */
export interface ScanOptions {
  include?: string[]
  exclude?: string[]
  cwd?: string
}

/** Result of `Compiler.scan`: how many files were parsed + their aggregated
 *  diagnostics. */
export interface ScanReport {
  count: number
  diagnostics: Diagnostic[]
}

/** Resolved cascade-layer names (config overrides merged over defaults). */
export interface LayerNames {
  reset: string
  base: string
  tokens: string
  recipes: string
  utilities: string
}

export interface CodegenFile {
  path: string
  code: string
  dependencies: CodegenDependency[]
}

export interface CodegenArtifact {
  id: CodegenArtifactId
  files: CodegenFile[]
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

/** One extracted call argument. A literal `null` (`{ kind: 'value', value: null }`)
 *  is distinguishable from a non-extractable argument (`{ kind: 'missing' }`). */
export type ExtractedArg = { kind: 'value'; value: unknown } | { kind: 'missing'; value?: undefined }

export interface ExtractedConditional {
  kind: 'conditional'
  branches: unknown[]
}

export interface ExtractedCall {
  category: MatchCategory
  /** Canonical Panda name; for `p.css(...)` the property name. */
  name: string
  /** Local binding at the call site; namespace alias for `p.css(...)`. */
  alias: string
  /** One entry per source argument, in order; `length` matches arity. */
  data: ExtractedArg[]
  span: Span
}

export interface ExtractedJsx {
  category: MatchCategory
  name: string
  alias: string
  data: Record<string, unknown>
  span: Span
}

export interface ExtractResult {
  calls: ExtractedCall[]
  jsx: ExtractedJsx[]
  diagnostics: Diagnostic[]
}

/** The JSON-safe, fully-resolved Panda config the compiler consumes.
 *
 *  Intentionally opaque: function-valued options (`utilities.*.transform`, …)
 *  are already lowered to `{ kind: 'js-callback', id }` refs, with the live
 *  functions supplied via {@link CompilerOptions.callbacks}. `@pandacss/config`
 *  produces values conforming to this; the compiler never imports config. */
export type SerializedConfig = Record<string, unknown>

export type ProjectCallbackKind = 'utility.transform' | 'utility.values' | 'pattern.transform' | 'pattern.defaultValues'

/** Common subset of the native `TokenDictionary` / wasm `TokenDictionaryInput`. */
export interface TokenLookup {
  values: Record<string, string>
  vars: Record<string, string>
}

export interface RawToken {
  path: string
  value: string
  var?: string
}

export interface ColorMixResult {
  invalid: boolean
  value: string
  color?: string
}

export interface TransformArgs {
  token: ((path: string) => string | undefined) & { raw: (path: string) => RawToken | undefined }
  raw: unknown
  utils: {
    colorMix(value: string): ColorMixResult
  }
}

export interface PatternHelpers {
  map(value: unknown, fn: (value: any) => any): unknown
  isCssUnit(value: unknown): boolean
  isCssVar(value: unknown): boolean
  isCssFunction(value: unknown): boolean
}

export type UtilityValuesTheme = (category: string) => Record<string, string> | undefined
export type UtilityValuesCallback = (theme: UtilityValuesTheme) => Record<string, string> | string[] | undefined
export type UtilityTransformCallback = (value: string, args: TransformArgs) => unknown
export type PatternTransformCallback = (props: Record<string, any>, helpers: PatternHelpers) => unknown
export type PatternDefaultValuesCallback = (props: Record<string, any>) => unknown

export interface ProjectCallbackMap {
  'utility.transform': Record<string, UtilityTransformCallback>
  'utility.values': Record<string, UtilityValuesCallback>
  'pattern.transform': Record<string, PatternTransformCallback>
  'pattern.defaultValues': Record<string, PatternDefaultValuesCallback>
}

export type ProjectCallbacks = Partial<ProjectCallbackMap>

/** Serialized config paired with its live callbacks, as produced by the host's
 *  `createConfigSnapshot`. */
export interface ConfigSnapshot {
  config: SerializedConfig
  callbacks?: ProjectCallbacks
}

export interface CompilerOptions {
  /** Defaults to `true`; lets `token('…')` and `import { x } from './tokens'` fold. */
  crossFile?: boolean
  callbacks?: ProjectCallbacks
}

export interface GlobOptions {
  include: string[]
  exclude?: string[]
  cwd?: string
  absolute?: boolean
}

/** In-memory filesystem handle, exposed as `Compiler.fs` on the wasm binding
 *  (the browser has no real FS); `undefined` on native. */
export interface CompilerFileSystem {
  addFile(path: string, content: string): void
  removeFile(path: string): boolean
  readFile(path: string): string | undefined
  exists(path: string): boolean
  glob(opts: GlobOptions): string[]
  fileCount(): number
}

/** A configured, long-lived compiler: built once from a serialized config, fed
 *  source files, drained to CSS via `compile()`. Identical on native and wasm —
 *  only construction differs (native sync; wasm async + populates `fs`). */
export interface Compiler {
  config(): SerializedConfig
  readonly fs?: CompilerFileSystem

  parseFile(path: string, source: string): ParseFileReport
  /** Re-parse `path` only if already known; `true` when present. Filter watch
   *  events through this to ignore unrelated files. */
  refreshFile(path: string, source: string): boolean
  removeFile(path: string): boolean
  clear(): void
  /** Discover + parse every source file matching the config's `include`/
   *  `exclude` (overridable) using the platform filesystem engine — disk on
   *  native, the in-memory `fs` on wasm. The host neither globs nor reads. */
  scan(options?: ScanOptions): ScanReport
  /** Source paths matching the config's `include`/`exclude` (overridable) via
   *  the filesystem engine — for the host's watch dependency list. */
  glob(options?: ScanOptions): string[]
  /** Resolved cascade-layer names (config overrides merged over defaults) — so
   *  the host can recognize the user's `@layer …;` directive. */
  layers(): LayerNames
  compile(): CompileOutput
  generateArtifacts(options?: GenerateArtifactOptions): CodegenArtifact[]
  generateArtifact(id: CodegenArtifactId, options?: GenerateArtifactOptions): CodegenArtifact | undefined
  generateAffectedArtifacts(dependencies: CodegenDependency[], options?: GenerateArtifactOptions): CodegenArtifact[]
  /** Stateless peek — returns raw calls/jsx, registers nothing. */
  extract(path: string, source: string): ExtractResult

  atoms(): Atom[]
  recipes(): RecipeEntry[]
  slotRecipes(): RecipeEntry[]
  encodedRecipes(): EncodedRecipeStyles
  staticPatternAtoms(): StaticPatternResult
  getFile(path: string): ParsedFileView | null
  fileManifest(): CompileFileManifest[]
  summary(): ProjectSummary
  diagnostics(): Diagnostic[]
  isEmpty(): boolean
}

// ── Host layer (Driver) ─────────────────────────────────────────────────────
// The orchestration contract above the `Compiler`. Lives here so both the node
// (`@pandacss/driver`) and browser (`@pandacss/driver-wasm`) implementations
// share one interface without depending on each other. See
// `design-notes/output-and-host-layer.md`.

/** Result of diffing two serialized configs — produced by config-loader's
 *  `diffConfig`, consumed by `Driver.reload`. */
export interface ConfigDiff {
  /** `true` when the configs differ (or there is no previous config). */
  hasChanged: boolean
  /** Coarse dependencies to feed `generateAffectedArtifacts(...)`. */
  dependencies: CodegenDependency[]
  /** Names of the specific recipes that changed — for per-entry file scoping. */
  recipes: string[]
  /** Names of the specific patterns that changed — for per-entry file scoping. */
  patterns: string[]
  /** Raw `microdiff` `Difference[]`, for the `config:change` hook / telemetry. */
  changes: unknown[]
}

/** A single source-file change routed in from a watcher. */
export interface SourceChange {
  path: string
  kind: 'add' | 'change' | 'unlink'
  /** File contents. Optional on node (the driver reads disk); required on the
   *  browser driver (no disk). */
  content?: string
}

/** Which artifacts to (re)generate. Omit for the full set. */
export interface ArtifactFilter {
  dependencies?: CodegenDependency[]
}

/** Host orchestrator above the pure {@link Compiler}: owns config lifecycle,
 *  source scanning (via the engine's fs), output cadence, and watch wiring.
 *  `@pandacss/driver` (node) and `@pandacss/driver-wasm` (browser) implement it,
 *  split only by environment. */
export interface Driver {
  /** The live engine handle (swapped on a config reload). */
  readonly compiler: Compiler
  /** The serialized config the current compiler was built from. */
  readonly config: SerializedConfig
  /** Resolved config path (node only). */
  readonly configPath?: string
  /** Module ids to watch for config invalidation. */
  readonly configDependencies: string[]

  /** Re-load the config, diff it against the current one, and rebuild the
   *  compiler when it changed. Browser drivers are snapshot-fed → no-change. */
  reload(): Promise<ConfigDiff>
  /** Discover + parse every source file via the engine's fs. */
  scan(): ScanReport
  /** Route one watcher event into the engine. `false` = unknown path / no-op. */
  applyChange(change: SourceChange): boolean
  /** Codegen artifacts — full set, or only those affected by a diff. */
  artifacts(filter?: ArtifactFilter): CodegenArtifact[]
  /** Compile the stylesheet → `CompileOutput`; the caller routes the `css` string. */
  compile(): CompileOutput
  /** Glob targets the host watcher should track. */
  watchTargets(): { sources: string[]; config: string[] }
}
