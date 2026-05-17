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

/** Per-call telemetry returned by `Project.parseFile()`. */
export interface FileReport {
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
  tokenDictionary?: TokenDictionary
  crossFile?: boolean
  callbacks?: ProjectCallbacks
}

export type ProjectCallbackKind = 'utility.transform' | 'utility.values' | 'pattern.transform'

export type ProjectCallbacks = Partial<Record<ProjectCallbackKind, Record<string, (...args: any[]) => unknown>>>

export interface ConfigSnapshot {
  config: Record<string, unknown>
  callbacks?: ProjectCallbacks
}

/** Stateful project orchestration. Holds a per-file atom registry,
 *  drops a file's contribution on `removeFile` / `refreshFile`, and
 *  runs the encoder over every extracted style so callers see `Atom[]`
 *  directly. For raw `ExtractedCall` / `ExtractedJsx` records (linting,
 *  parity testing), use `Extractor` instead. */
export interface ProjectInstance {
  config(): Record<string, unknown> | null
  registerUtilityTransform?(id: string, callback: (value: unknown, args: Record<string, unknown>) => unknown): void
  registerPatternTransform?(id: string, callback: (props: unknown, helpers: Record<string, unknown>) => unknown): void
  parseFile(path: string, source: string): FileReport
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
  summary(): ProjectSummary
}

export interface ProjectConstructor {
  new (matchers: Matchers, options?: ProjectOptions): ProjectInstance
  fromConfig(config: Record<string, unknown> | ConfigSnapshot, options?: ProjectOptions): ProjectInstance
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
const projectConfigs = new WeakMap<ProjectInstance, Record<string, unknown>>()
const projectCallbacks = new WeakMap<ProjectInstance, ProjectCallbacks>()
const nativeProjectFromConfig =
  'fromConfig' in binding.Project && typeof binding.Project.fromConfig === 'function'
    ? binding.Project.fromConfig.bind(binding.Project)
    : undefined

if (!('config' in binding.Project.prototype)) {
  binding.Project.prototype.config = function config(this: ProjectInstance) {
    return projectConfigs.get(this) ?? null
  }
}

if (!('isEmpty' in binding.Project.prototype)) {
  binding.Project.prototype.isEmpty = function isEmpty(this: ProjectInstance) {
    const summary = this.summary()
    return (
      summary.filesProcessed === 0 &&
      summary.atomCount === 0 &&
      summary.recipeCount === 0 &&
      summary.slotRecipeCount === 0
    )
  }
}

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

/** Stateful project orchestration. Returns `Atom[]` directly (the
 *  encoder is wired in) and tracks recipes across files. Use this
 *  when the caller wants atom-level output and watch-mode semantics;
 *  use `Extractor` for raw extraction records. */
function createProject(matchers: Matchers, options?: ProjectOptions) {
  return new binding.Project(matchers, stripProjectCallbacks(options))
}

createProject.prototype = binding.Project.prototype
Object.setPrototypeOf(createProject, binding.Project)
Object.defineProperty(createProject, 'fromConfig', {
  value(configOrSnapshot: Record<string, unknown> | ConfigSnapshot, options?: ProjectOptions) {
    const { config, callbacks } = normalizeProjectConfigInput(configOrSnapshot, options)
    const nativeOptions = stripProjectCallbacks(options)
    if (nativeProjectFromConfig) {
      const project = nativeProjectFromConfig(config, nativeOptions)
      if (registerNativeProjectCallbacks(project, callbacks)) return project
      projectCallbacks.set(project, callbacks)
      return wrapProjectCallbacks(project)
    }
    const project = new binding.Project(matchersFromSerializedConfig(config), nativeOptions)
    projectConfigs.set(project, config)
    projectCallbacks.set(project, callbacks)
    return wrapProjectCallbacks(project)
  },
})

export const Project = createProject as unknown as ProjectConstructor

export function getBindingInfo() {
  return {
    native: binding !== fallback,
  }
}

function matchersFromSerializedConfig(config: Record<string, unknown>): Matchers {
  const importMap = normalizeImportMap(config)
  const jsxFactory = typeof config.jsxFactory === 'string' ? config.jsxFactory : 'styled'
  const jsxNames = jsxNamesFromSerializedConfig(config, jsxFactory)

  return {
    css: { modules: importMap.css, names: ['css', 'cva', 'sva'] },
    recipe: { modules: importMap.recipe },
    pattern: { modules: importMap.pattern },
    jsx: { modules: importMap.jsx, names: jsxNames },
    tokens: { modules: importMap.tokens, names: ['token'] },
    jsxFactories: [jsxFactory],
  }
}

function jsxNamesFromSerializedConfig(config: Record<string, unknown>, jsxFactory: string) {
  const names = [jsxFactory, 'Box']
  collectPatternJsxNames(config.patterns, names)

  const theme = config.theme
  if (isPlainObject(theme)) {
    collectRecipeJsxNames(theme.recipes, names)
    collectSlotRecipeJsxNames(theme.slotRecipes, names)

    if (isPlainObject(theme.extend)) {
      collectRecipeJsxNames(theme.extend.recipes, names)
      collectSlotRecipeJsxNames(theme.extend.slotRecipes, names)
    }
  }

  return Array.from(new Set(names))
}

function collectPatternJsxNames(value: unknown, names: string[]) {
  if (!isPlainObject(value)) return
  collectPatternMapJsxNames(value, names)
  if (isPlainObject(value.extend)) collectPatternMapJsxNames(value.extend, names)
}

function collectPatternMapJsxNames(patterns: Record<string, unknown>, names: string[]) {
  for (const [name, pattern] of Object.entries(patterns)) {
    if (name === 'extend' || !isPlainObject(pattern)) continue
    names.push(typeof pattern.jsxName === 'string' ? pattern.jsxName : capitalize(name))
    collectStringArray(pattern.jsx, names)
  }
}

function collectRecipeJsxNames(value: unknown, names: string[]) {
  if (!isPlainObject(value)) return
  for (const [name, recipe] of Object.entries(value)) {
    names.push(capitalize(name))
    if (isPlainObject(recipe)) collectStringArray(recipe.jsx, names)
  }
}

function collectSlotRecipeJsxNames(value: unknown, names: string[]) {
  if (!isPlainObject(value)) return
  for (const [name, recipe] of Object.entries(value)) {
    const capitalized = capitalize(name)
    names.push(capitalized, `${capitalized}.Root`, `${capitalized}Root`)
    if (isPlainObject(recipe)) collectStringArray(recipe.jsx, names)
  }
}

function collectStringArray(value: unknown, names: string[]) {
  if (!Array.isArray(value)) return
  for (const item of value) {
    if (typeof item === 'string') names.push(item)
  }
}

function capitalize(value: string) {
  return value ? value[0]!.toUpperCase() + value.slice(1) : ''
}

function isPlainObject(value: unknown): value is Record<string, any> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function normalizeImportMap(config: Record<string, unknown>) {
  const outdir =
    typeof config.outdir === 'string' ? config.outdir.split('/').at(-1) ?? 'styled-system' : 'styled-system'
  const map = config.importMap
  if (map && typeof map === 'object' && !Array.isArray(map)) {
    const input = map as Record<string, unknown>
    return {
      css: toStringArray(input.css, `${outdir}/css`),
      recipe: toStringArray(input.recipe ?? input.recipes, `${outdir}/recipes`),
      pattern: toStringArray(input.pattern ?? input.patterns, `${outdir}/patterns`),
      jsx: toStringArray(input.jsx, `${outdir}/jsx`),
      tokens: toStringArray(input.tokens, `${outdir}/tokens`),
    }
  }
  if (typeof map === 'string') {
    return {
      css: [`${map}/css`],
      recipe: [`${map}/recipes`],
      pattern: [`${map}/patterns`],
      jsx: [`${map}/jsx`],
      tokens: [`${map}/tokens`],
    }
  }
  return {
    css: [`${outdir}/css`],
    recipe: [`${outdir}/recipes`],
    pattern: [`${outdir}/patterns`],
    jsx: [`${outdir}/jsx`],
    tokens: [`${outdir}/tokens`],
  }
}

function toStringArray(value: unknown, fallback: string) {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string')
  return typeof value === 'string' ? [value] : [fallback]
}

function normalizeProjectConfigInput(
  input: Record<string, unknown> | ConfigSnapshot,
  options?: ProjectOptions,
): { config: Record<string, unknown>; callbacks: ProjectCallbacks } {
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

function isConfigSnapshot(input: Record<string, unknown> | ConfigSnapshot): input is ConfigSnapshot {
  return !!input.config && typeof input.config === 'object' && !Array.isArray(input.config)
}

function stripProjectCallbacks(options: ProjectOptions | undefined): ProjectOptions | undefined {
  if (!options) return undefined
  const { callbacks: _callbacks, ...rest } = options
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

function wrapProjectCallbacks(project: ProjectInstance): ProjectInstance {
  const callbacks = projectCallbacks.get(project)
  if (!callbacks?.['utility.transform'] || Object.keys(callbacks['utility.transform']).length === 0) {
    return project
  }
  const utilityTransformCache = new Map<string, Atom[]>()

  return {
    config: () => project.config(),
    parseFile: (path, source) => project.parseFile(path, source),
    refreshFile: (path, source) => project.refreshFile(path, source),
    removeFile: (path) => project.removeFile(path),
    clear: () => {
      utilityTransformCache.clear()
      project.clear()
    },
    isEmpty: () => project.isEmpty(),
    atoms: () => applyUtilityTransformCallbacks(project.atoms(), project.config(), callbacks, utilityTransformCache),
    recipes: () => project.recipes(),
    slotRecipes: () => project.slotRecipes(),
    summary: () => project.summary(),
  }
}

function registerNativeProjectCallbacks(project: ProjectInstance, callbacks: ProjectCallbacks) {
  let registered = false
  const transforms = callbacks['utility.transform']
  if (project.registerUtilityTransform && transforms && Object.keys(transforms).length > 0) {
    for (const [id, callback] of Object.entries(transforms)) {
      project.registerUtilityTransform(id, callback)
    }
    registered = true
  }

  const patternTransforms = callbacks['pattern.transform']
  if (project.registerPatternTransform && patternTransforms && Object.keys(patternTransforms).length > 0) {
    for (const [id, callback] of Object.entries(patternTransforms)) {
      project.registerPatternTransform(id, callback)
    }
    registered = true
  }

  return registered
}

function applyUtilityTransformCallbacks(
  atoms: Atom[],
  config: Record<string, unknown> | null,
  callbacks: ProjectCallbacks,
  cache: Map<string, Atom[]>,
): Atom[] {
  const transforms = callbacks['utility.transform']
  if (!config || !transforms) return atoms

  const utilityTransforms = getUtilityTransformRefs(config)
  if (utilityTransforms.size === 0) return atoms

  return atoms.flatMap((atom) => {
    const id = utilityTransforms.get(atom.prop)
    const transform = id ? transforms[id] : undefined
    if (!transform) return [atom]

    const cacheKey = `${id}\0${atom.prop}\0${JSON.stringify(atom.value)}`
    const cached = cache.get(cacheKey)
    if (cached) return applyConditions(cached, atom.conditions)

    const result = transform(atom.value, {
      raw: atom.value,
      token: Object.assign(() => undefined, { raw: () => undefined }),
      utils: {
        colorMix: (value: string) => ({ invalid: true, value }),
      },
    })

    if (!result || typeof result !== 'object' || Array.isArray(result)) return []
    const transformed = styleObjectToAtoms(result as Record<string, unknown>, [])
    cache.set(cacheKey, transformed)
    return applyConditions(transformed, atom.conditions)
  })
}

function getUtilityTransformRefs(config: Record<string, unknown>) {
  const refs = new Map<string, string>()
  const utilities = config.utilities
  if (!utilities || typeof utilities !== 'object' || Array.isArray(utilities)) return refs

  for (const [prop, utility] of Object.entries(utilities as Record<string, unknown>)) {
    if (!utility || typeof utility !== 'object' || Array.isArray(utility)) continue
    const transform = (utility as Record<string, unknown>).transform
    if (isCallbackRef(transform)) refs.set(prop, transform.id)
  }

  return refs
}

function isCallbackRef(value: unknown): value is { kind: 'js-callback'; id: string } {
  return (
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    (value as Record<string, unknown>).kind === 'js-callback' &&
    typeof (value as Record<string, unknown>).id === 'string'
  )
}

function styleObjectToAtoms(style: Record<string, unknown>, baseConditions: string[]): Atom[] {
  const atoms: Atom[] = []
  walkStyle(style, [], baseConditions, atoms)
  return atoms.sort(compareAtoms)
}

function walkStyle(value: unknown, path: string[], baseConditions: string[], atoms: Atom[]) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      walkStyle(child, path.concat(key), baseConditions, atoms)
    }
    return
  }

  const prop = path[0]
  if (!prop) return
  atoms.push({
    prop,
    value: normalizeAtomValue(value),
    conditions: [...baseConditions],
  })
}

function normalizeAtomValue(value: unknown): Atom['value'] {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null)
    return value
  if (Array.isArray(value)) return `[${value.join(',')}]`
  return String(value)
}

function applyConditions(atoms: Atom[], conditions: string[]): Atom[] {
  if (conditions.length === 0) return atoms
  return atoms.map((atom) => ({ ...atom, conditions: [...conditions] }))
}

function compareAtoms(a: Atom, b: Atom) {
  return (
    a.prop.localeCompare(b.prop) ||
    a.conditions.join('\0').localeCompare(b.conditions.join('\0')) ||
    String(a.value).localeCompare(String(b.value))
  )
}
