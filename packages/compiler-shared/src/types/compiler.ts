import type { BuildInfo, BuildInfoApi, BuildInfoIncompatibility } from './build-info'
import type {
  CompileOptions,
  CompileOutput,
  CssFile,
  CompileFileManifest,
  LayerCssOptions,
  LayerNames,
  ScanOptions,
  SourceEntry,
  SplitCssOptions,
  WriteCssOptions,
  WriteCssResult,
  WriteFilesResult,
  WriteLayerCssOptions,
  WriteSplitCssOptions,
} from './css'
import type {
  CodegenArtifact,
  CodegenArtifactId,
  CodegenDependency,
  GenerateArtifactOptions,
  WriteArtifactsOptions,
} from './codegen'
import type { Diagnostic } from './diagnostics'
import type { ExtractResult, Atom, FileInspectionResult } from './extraction'
import type { ParseFileReport, ParsedFileView, ProjectSummary, StaticPatternResult } from './parsing'
import type { EncodedRecipeStyles, RecipeEntry } from './recipes'
import type { SerializedConfig } from './config'
import type { Spec } from './spec'
import type { ResolveUtilityValueInput, ResolvedUtilityValue, TokenSuggestion } from './tokens'

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

// ---------------------------------------------------------------------------
// Design-system manifest — `panda.lib.json` (the `designSystem` field)
// ---------------------------------------------------------------------------

/** Published import specifiers per category, so a library's compiled JSX keeps
 *  importing from the DS (`@acme/ds/css`), not the consumer's `styled-system`. */
export interface DesignSystemManifestImportMap {
  css?: string
  recipes?: string
  patterns?: string
  jsx?: string
  tokens?: string
}

/** Host-supplied manifest fields — everything but the engine-stamped
 *  `schemaVersion`. Paths are relative to the manifest's own directory. */
export interface DesignSystemManifestInput {
  name: string
  /** Informational; powers the drift receipt, never enforced. */
  version?: string
  /** Peer Panda range the consumer's Panda must satisfy. */
  panda: string
  preset: string
  buildInfo: string
  importMap?: DesignSystemManifestImportMap
  /** This library's own parent design system — the chain link. Absent at a root. */
  designSystem?: string
  /** Re-extract fallback globs when build info can't be hydrated (version skew). */
  files?: string[]
}

/** `panda.lib.json` — the published manifest: host input plus the engine-stamped
 *  `schemaVersion`. */
export interface DesignSystemManifest extends DesignSystemManifestInput {
  schemaVersion: number
}

/** Why a manifest is incompatible: a `schemaVersion` wire mismatch, or the
 *  consumer's Panda major outside the manifest's `panda` range (`pandaRange`). */
export type DesignSystemManifestIncompatibility = 'schemaVersion' | 'pandaRange'

/** Discriminated result so `ok: true` narrows away `reason`. */
export type DesignSystemManifestCompatibility =
  | { ok: true }
  | { ok: false; reason: DesignSystemManifestIncompatibility }

/** Options for {@link DesignSystemApi.validate}. */
export interface DesignSystemValidateOptions {
  /** The consumer's running Panda version. When given, `validate` also checks
   *  its major against the manifest's `panda` range — a `pandaRange` failure on
   *  mismatch. Omit to check `schemaVersion` only. */
  pandaVersion?: string
}

/** Raw chain plan the binding returns — a status-tagged value the namespace
 *  reshapes into {@link DesignSystemChainResult}. */
export type DesignSystemChainPlan = { status: 'ordered'; order: string[] } | { status: 'cycle'; cycle: string[] }

/** Outcome of `resolveChain`: the deduped root-first merge/hydrate `order`, or
 *  the `cycle` loop path on failure. */
export type DesignSystemChainResult = { ok: true; order: string[] } | { ok: false; reason: 'cycle'; cycle: string[] }

/** Inputs to `load` — the library's already-read build info plus the consumer's
 *  imports from the design system, for tree-shaking. */
export interface DesignSystemLoadOptions {
  /** The library's portable encoder state (its `panda.buildinfo.json`), already
   *  read off disk by the host. */
  buildInfo: BuildInfo
  /** Export names the consumer imports from the design system; resolved to
   *  modules via the build info's `exports` so only their CSS emits. Omit to
   *  hydrate every module (e.g. a namespace import). */
  imports?: string[]
  /** The consumer's running Panda version, forwarded to `validate` so `load`
   *  also gates on the `panda` range. See {@link DesignSystemValidateOptions}. */
  pandaVersion?: string
}

/** Outcome of `load`: the hydrated `modules` keyed under the manifest name, or a
 *  `reason` (wire mismatch / incompatible build info) the host falls back on by
 *  re-extracting the manifest's `files`. */
export type DesignSystemLoadResult =
  | { ok: true; name: string; modules: string[] }
  | { ok: false; reason: DesignSystemManifestIncompatibility | BuildInfoIncompatibility; modules: [] }

/** Produce, validate, and load `panda.lib.json`. Accessed as
 *  `compiler.designSystem`. */
export interface DesignSystemApi {
  /** The manifest wire-format version this compiler reads/writes. */
  readonly schemaVersion: number

  /** Build a manifest from host-supplied fields, stamping the schema version —
   *  the producer side (`panda lib`). */
  create(input: DesignSystemManifestInput): DesignSystemManifest

  /** Check a manifest's `schemaVersion` against this compiler, plus the `panda`
   *  major against `options.pandaVersion` when supplied — so `ok: true` means
   *  safe to use, not just a matching wire version. */
  validate(manifest: DesignSystemManifest, options?: DesignSystemValidateOptions): DesignSystemManifestCompatibility

  /** Consumer side (`designSystem: '@acme/ds'`): validate the manifest and
   *  hydrate the modules the consumer's imports touch, under the manifest name.
   *  The build-info half only — preset + `importMap` merge in the host. */
  load(manifest: DesignSystemManifest, options: DesignSystemLoadOptions): DesignSystemLoadResult

  /** Order already-read manifests by their parent (`designSystem`) links into a
   *  deduped, root-first plan — the composition case. Catches cycles. */
  resolveChain(manifests: DesignSystemManifest[]): DesignSystemChainResult
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
  /** Resolve `path` against the compiler host cwd. Absolute paths are returned unchanged. */
  resolvePath(path: string, cwd?: string): string
  /** Join path segments using the compiler host path semantics. */
  joinPath(parts: string[]): string
  /** Parent path using the compiler host path semantics. */
  dirname(path: string): string
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
   *  `cssgen --minimal`. */
  getLayerCss(options: LayerCssOptions): CompileOutput
  /** The stylesheet as a set of writable files (one per layer + per recipe,
   *  plus `recipes.css` / `styles.css` index files) — backs `cssgen --splitting`.
   *  The host writes each `path -> code`, the same model as `writeArtifacts`. */
  getSplitCss(options?: SplitCssOptions): CssFile[]

  /** Build-info distribution — produce, validate, and hydrate a design system's
   *  serialized encoder state. See {@link BuildInfoApi}. */
  readonly buildInfo: BuildInfoApi

  /** Design-system manifest — produce + validate `panda.lib.json`. See
   *  {@link DesignSystemApi}. */
  readonly designSystem: DesignSystemApi

  // Codegen artifacts
  /** Generate + write artifacts under `outdir` via the platform fs (disk on
   *  native, in-memory on wasm). Returns the written paths. */
  writeArtifacts(options: WriteArtifactsOptions): string[]
  /** Generate + write stylesheet CSS via the platform fs. */
  writeCss(options: WriteCssOptions): WriteCssResult
  /** Generate + write CSS for selected layers via the platform fs. */
  writeLayerCss(options: WriteLayerCssOptions): WriteCssResult
  /** Generate + write split stylesheet files under `outdir` via the platform fs. */
  writeSplitCss(options: WriteSplitCssOptions): WriteFilesResult
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
  /** Resolve selector and CSS metadata for one utility prop/value pair. */
  resolveUtilityValue(input: ResolveUtilityValueInput): ResolvedUtilityValue | null
  /** Tokens that carry a hardcoded value, ranked (safe equivalents first). */
  suggestTokens(prop: string, value: string): TokenSuggestion[]

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
