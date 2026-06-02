/**
 * Data-shape contract shared by the Panda compiler bindings — the serialized
 * surface `@pandacss/compiler` (native) and `@pandacss/compiler-wasm` (browser)
 * both speak. Pure types, no runtime, no internal imports (leaf module).
 */

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
  /** Source path parsed for this report. */
  path: string
  /** Number of `css(...)` calls extracted from this file. */
  cssCalls: number
  /** Number of `cva(...)` recipe calls extracted from this file. */
  cvaCalls: number
  /** Number of `sva(...)` slot-recipe calls extracted from this file. */
  svaCalls: number
  /** Number of JSX style usages extracted from this file. */
  jsxUsages: number
  /** Diagnostics produced while parsing this file. */
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

export type CodegenArtifactId = 'conditions' | 'css-index' | 'cx' | 'helpers' | 'patterns' | 'types'

export type CodegenDependency =
  | 'codegenFormat'
  | 'codegenImportExtensions'
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
  codegenImportExtensions?: boolean
}

export interface CodegenOptions extends GenerateArtifactOptions {
  outdir?: string
  cwd?: string
}

/** Scan overrides for `Compiler.scan`/`parseFiles`. Omitted fields fall back to the
 *  config's `include`/`exclude`/`cwd`. */
export interface ScanOptions {
  include?: string[]
  exclude?: string[]
  cwd?: string
}

/** Resolved cascade-layer names (config overrides merged over defaults). */
export interface LayerNames {
  reset: string
  base: string
  tokens: string
  recipes: string
  utilities: string
}

/** The five cascade layers, in emit order. */
export type StylesheetLayerName = 'reset' | 'base' | 'tokens' | 'recipes' | 'utilities'

/** One file in a `--splitting` output set — a relative path (`tokens.css`,
 *  `recipes/button.css`, `styles.css`, …) and its CSS. Written verbatim by the
 *  host, the same model as a codegen artifact file. */
export interface CssFile {
  path: string
  code: string
}

/** A source glob with its static base directory (the dir a watcher subscribes to). */
export interface SourceEntry {
  base: string
  pattern: string
}

export type UsageKind = 'token' | 'property' | 'recipe' | 'pattern' | 'keyframe'

/** One classified Panda usage with its source range — for reporting, lint, IDE.
 *  `name` is a token path, canonical property, or recipe/pattern name. */
export interface UsageSite {
  kind: UsageKind
  name: string
  range: SourceRange
}

export interface SpecUtilityProperty {
  name: string
  cssProperty?: string
  tokenCategory?: string
  literals: string[]
  alias: string
}

export interface SpecTokenCategory {
  name: string
  typeName: string
  values: string[]
}

/** Tooling introspection snapshot — read once, index on the host (never query
 *  the engine per-item in a hot loop). Powers reporting / formatting / linting. */
export interface Spec {
  conditions: { keys: string[]; breakpoints: string[] }
  tokens: {
    categories: Record<string, SpecTokenCategory>
    colorPalettes: string[]
    /** `path -> value` (empty value means it equals the token's CSS var). */
    values: Record<string, string>
    deprecated: string[]
  }
  utilities: {
    properties: Record<string, SpecUtilityProperty>
    /** `shorthand -> canonical property`. */
    shorthands: Record<string, string>
    deprecated: string[]
  }
  /** Keyed by pattern name. */
  patterns: { patterns: Record<string, unknown> }
  /** Keyed by recipe name. */
  recipes: { recipes: Record<string, unknown>; slotRecipes: Record<string, unknown> }
  /** Canonical emit order for property names (for a stable property sort). */
  propertyOrder: string[]
  jsxFactory?: string
  importMap?: { css: string[]; recipe: string[]; pattern: string[]; jsx: string[]; tokens: string[] }
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

export interface CompileOptions {
  /** Emit Panda's leading cascade-layer order declaration (`@layer reset, ...;`). */
  emitLayerDeclaration?: boolean
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

export interface FileInspectionResult {
  usages: UsageSite[]
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

/** In-memory filesystem handle, exposed as `Compiler.fs` on the wasm binding
 *  (the browser has no real FS); `undefined` on native. */
export interface CompilerFileSystem {
  /** Add or replace a source file in the in-memory filesystem. */
  addFile(path: string, content: string): void
  /** Remove a file from the in-memory filesystem. Returns `true` when it existed. */
  removeFile(path: string): boolean
  /** Read a file from the in-memory filesystem. Returns `undefined` when missing. */
  readFile(path: string): string | undefined
  /** `true` when `path` exists as a file or directory. */
  exists(path: string): boolean
  /** Number of files currently staged in the in-memory filesystem. */
  fileCount(): number
}

/** A configured, long-lived compiler: built once from a serialized config, fed
 *  source files, drained to CSS via `compile()`. Identical on native and wasm —
 *  only construction differs (native sync; wasm async + populates `fs`). */
export interface Compiler {
  /** Environment-specific filesystem handle. Present only on wasm/browser. */
  readonly fs?: CompilerFileSystem

  // Config and introspection
  /** Serialized config snapshot this compiler was created with. */
  config(): SerializedConfig
  /** Resolved cascade-layer names (config overrides merged over defaults) — so
   *  the host can recognize the user's `@layer …;` directive. */
  layers(): LayerNames
  /** Whether `css` has Panda's cascade-layer declaration (`@layer reset, base, …;`),
   *  marking it as the stylesheet root a bundler injects the compiled CSS into. */
  hasLayerDeclaration(css: string): boolean
  /** Tooling introspection snapshot — read once, index on the host. */
  spec(): Spec
  /** Source globs + their static base dirs (for the host watcher). */
  sources(): SourceEntry[]
  /** Config validation diagnostics captured at construction time. */
  diagnostics(): Diagnostic[]

  // File discovery and parsing
  /** Source paths matching the config's `include`/`exclude` (overridable) via
   *  the filesystem engine — for discovery and host watch lists. */
  scan(options?: ScanOptions): string[]
  /** Real on-disk path (absolute, symlinks followed) via the filesystem engine,
   *  so two paths to the same file compare equal. Returns the input if unresolved. */
  realpath(path: string): string
  /** Whether `path` is a source file the project extracts from — its `cwd`-relative
   *  form matches the configured `include`/`exclude` globs. For routing watch events. */
  isSourceFile(path: string): boolean
  /** Read + parse paths returned from `scan()`, returning one report per file
   *  that was successfully read and parsed. */
  parseFiles(paths: string[]): ParseFileReport[]
  /** Read + parse a path from the compiler filesystem. */
  parseFile(path: string): ParseFileReport
  /** Parse provided source text for `path`. */
  parseFileSource(path: string, source: string): ParseFileReport
  /** Re-parse `path` only if already known; `true` when present. Filter watch
   *  events through this to ignore unrelated files. */
  refreshFile(path: string): boolean
  /** Re-parse provided source text for `path` only if already known. */
  refreshFileSource(path: string, source: string): boolean
  /** Drop one known file's atoms, recipes, and diagnostics from project state. */
  removeFile(path: string): boolean
  /** Drop all parsed file state while keeping the compiled config. */
  clear(): void

  // CSS output
  /** Compile the current project state into a complete stylesheet. */
  compile(options?: CompileOptions): CompileOutput
  /** CSS for the named layers only, concatenated in order — sliced in Rust so
   *  byte offsets stay valid. Pairs with `layers()` (names). Backs
   *  `cssgen <layer>` / `--minimal`. */
  layerCss(layers: StylesheetLayerName[]): string
  /** The stylesheet as a set of writable files (one per layer + per recipe,
   *  plus `recipes.css` / `styles.css` index files) — backs `cssgen --splitting`.
   *  The host writes each `path -> code`, the same model as `writeArtifacts`. */
  splitCss(): CssFile[]

  // Codegen artifacts
  /** Generate + write artifacts under `outdir` via the platform fs (disk on
   *  native, in-memory on wasm). Returns the written paths. */
  writeArtifacts(outdir: string, cwd?: string, options?: GenerateArtifactOptions): string[]
  /** Generate all codegen artifacts in memory without writing them. */
  generateArtifacts(options?: GenerateArtifactOptions): CodegenArtifact[]
  /** Generate a single codegen artifact by id. */
  generateArtifact(id: CodegenArtifactId, options?: GenerateArtifactOptions): CodegenArtifact | undefined
  /** Generate only artifacts affected by the provided config dependency set. */
  generateAffectedArtifacts(dependencies: CodegenDependency[], options?: GenerateArtifactOptions): CodegenArtifact[]

  // Tooling queries
  /** Stateless source extraction — returns raw calls/jsx, registers nothing. */
  extractFileSource(path: string, source: string): ExtractResult
  /** Stateless source inspection for classified Panda usage sites and
   *  file-local extraction diagnostics. */
  inspectFileSource(path: string, source: string): FileInspectionResult

  // Project state views
  /** Deduplicated atoms across all currently parsed files. */
  atoms(): Atom[]
  /** Inline and config `cva()` recipes in stable `(file, span)` order. */
  recipes(): RecipeEntry[]
  /** Inline and config `sva()` slot recipes in stable `(file, span)` order. */
  slotRecipes(): RecipeEntry[]
  /** Encoded recipe styles accumulated from parsed files. */
  encodedRecipes(): EncodedRecipeStyles
  /** Static pattern atoms expanded from `staticCss.patterns`. */
  staticPatternAtoms(): StaticPatternResult
  /** Read-only view for one parsed file, or `null` when unknown. */
  getFile(path: string): ParsedFileView | null
  /** Stable `(path, source hash)` manifest for known files. */
  fileManifest(): CompileFileManifest[]
  /** Cheap aggregate counts for the current project state. */
  summary(): ProjectSummary
  /** `true` when no parsed file or accumulated output state is present. */
  isEmpty(): boolean
}
