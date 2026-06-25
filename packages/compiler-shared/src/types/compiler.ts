import type { SerializedConfig } from './config'
import type { Diagnostic } from './diagnostics'
import type {
  Atom,
  EncodedRecipeStyles,
  ExtractResult,
  FileInspectionResult,
  ParsedFileView,
  ParseFileReport,
  ProjectSummary,
  RecipeEntry,
  ResolveUtilityValueInput,
  ResolvedUtilityValue,
  StaticPatternResult,
  TokenSuggestion,
} from './extraction'
import type {
  CodegenArtifact,
  CodegenArtifactId,
  CodegenDependency,
  CompileFileManifest,
  CompileOptions,
  CompileOutput,
  CssFile,
  GenerateArtifactOptions,
  LayerCssOptions,
  LayerNames,
  ScanOptions,
  SourceEntry,
  SplitCssOptions,
  Spec,
  WriteArtifactsOptions,
  WriteCssOptions,
  WriteCssResult,
  WriteFilesResult,
  WriteLayerCssOptions,
  WriteSplitCssOptions,
} from './output'

/**
 * In-memory filesystem exposed by the wasm/browser binding.
 */
export interface CompilerFileSystem {
  addFile(path: string, content: string): void
  removeFile(path: string): boolean
  readFile(path: string): string | undefined
  exists(path: string): boolean
  fileCount(): number
}

/**
 * Portable design-system encoder state (`panda.buildinfo.json`).
 */
export interface BuildAtom {
  p: number
  /**
   * String-table index, token pair, number marker, boolean, or null.
   */
  v: number | { t: number; v: number } | { n: number } | boolean | null
  c?: number[]
  i?: boolean
}

/**
 * Interned recipe or slot-recipe style group.
 */
export interface BuildRecipeGroup {
  r: number
  slot?: number
  cls: number
  cond?: number[]
  entries: BuildAtom[]
}

/**
 * Recipe state addressed by the per-module provenance map.
 */
export interface BuildRecipes {
  base?: BuildRecipeGroup[]
  variants?: BuildRecipeGroup[]
  compounds?: BuildRecipeGroup[]
  atomic?: BuildAtom[]
}

export interface BuildModuleEntry {
  atoms?: number[]
  recipes?: number[]
}

/**
 * Serialized encoder state that lets consumers hydrate CSS without re-extracting a library.
 */
export interface BuildInfo {
  schemaVersion: number
  panda: string
  configFingerprint: string
  strings: string[]
  atoms: BuildAtom[]
  recipes?: BuildRecipes
  modules: Record<string, BuildModuleEntry>
  exports?: Record<string, string>
}

export type BuildInfoIncompatibility = 'schemaVersion' | 'pandaRange'

export type BuildInfoCompatibility = { ok: true } | { ok: false; reason: BuildInfoIncompatibility }

export interface BuildInfoCreateOptions {
  panda: string
}

export interface BuildInfoHydrateOptions {
  /**
   * Stable source design-system name. Later hydrates of the same name replace cleanly.
   */
  name: string
  /**
   * Restrict hydration to module keys touched by the consumer. Omit for all modules.
   */
  only?: string[]
}

export type BuildInfoHydrateResult =
  | { ok: true; modules: string[] }
  | { ok: false; reason: BuildInfoIncompatibility; modules: [] }

export interface BuildInfoApi {
  readonly configFingerprint: string
  create(options: BuildInfoCreateOptions): BuildInfo
  validate(buildInfo: BuildInfo): BuildInfoCompatibility
  /**
   * Resolve barrel export names to module keys using `BuildInfo.exports`.
   */
  modulesFor(buildInfo: BuildInfo, exportNames: string[]): string[]
  hydrate(buildInfo: BuildInfo, options: BuildInfoHydrateOptions): BuildInfoHydrateResult
}

/**
 * Design-system manifest (`panda.lib.json`).
 */
export interface DesignSystemManifestImportMap {
  css?: string
  recipes?: string
  patterns?: string
  jsx?: string
  tokens?: string
}

export interface DesignSystemManifestInput {
  name: string
  /**
   * Informational; powers drift reporting but is not enforced.
   */
  version?: string
  /**
   * Peer Panda range the consumer must satisfy.
   */
  panda: string
  preset: string
  buildInfo: string
  importMap?: DesignSystemManifestImportMap
  /**
   * Parent design-system link. Absent at a root.
   */
  designSystem?: string
  /**
   * Re-extract fallback globs when build info cannot be hydrated.
   */
  files?: string[]
}

export interface DesignSystemManifest extends DesignSystemManifestInput {
  schemaVersion: number
}

export type DesignSystemManifestIncompatibility = 'schemaVersion' | 'pandaRange'

export type DesignSystemManifestCompatibility =
  | { ok: true }
  | { ok: false; reason: DesignSystemManifestIncompatibility }

export interface DesignSystemValidateOptions {
  pandaVersion?: string
}

export type DesignSystemChainPlan = { status: 'ordered'; order: string[] } | { status: 'cycle'; cycle: string[] }

export type DesignSystemChainResult = { ok: true; order: string[] } | { ok: false; reason: 'cycle'; cycle: string[] }

export interface DesignSystemLoadOptions {
  buildInfo: BuildInfo
  /**
   * Export names imported by the consumer; omit for namespace/all-module hydration.
   */
  imports?: string[]
  pandaVersion?: string
}

export type DesignSystemLoadResult =
  | { ok: true; name: string; modules: string[] }
  | { ok: false; reason: DesignSystemManifestIncompatibility | BuildInfoIncompatibility; modules: [] }

export interface DesignSystemApi {
  readonly schemaVersion: number
  create(input: DesignSystemManifestInput): DesignSystemManifest
  validate(manifest: DesignSystemManifest, options?: DesignSystemValidateOptions): DesignSystemManifestCompatibility
  load(manifest: DesignSystemManifest, options: DesignSystemLoadOptions): DesignSystemLoadResult
  /**
   * Order manifests by parent links into a root-first plan, or report a cycle.
   */
  resolveChain(manifests: DesignSystemManifest[]): DesignSystemChainResult
}

/**
 * Configured compiler surface shared by native and wasm bindings.
 */
export interface Compiler {
  readonly fs?: CompilerFileSystem

  /**
   * Config and introspection.
   */
  config(): SerializedConfig
  layers(): LayerNames
  hasLayerDeclaration(css: string): boolean
  spec(): Spec
  sources(): SourceEntry[]
  diagnostics(): Diagnostic[]

  /**
   * File discovery and parsing.
   */
  scan(options?: ScanOptions): string[]
  realpath(path: string): string
  resolvePath(path: string, cwd?: string): string
  joinPath(parts: string[]): string
  dirname(path: string): string
  isSourceFile(path: string): boolean
  parseFiles(paths: string[]): ParseFileReport[]
  parseFile(path: string): ParseFileReport
  parseFileSource(path: string, source: string): ParseFileReport
  refreshFile(path: string): boolean
  refreshFileSource(path: string, source: string): boolean
  removeFile(path: string): boolean
  clear(): void

  /**
   * CSS output.
   */
  compile(options?: CompileOptions): CompileOutput
  getLayerCss(options: LayerCssOptions): CompileOutput
  getSplitCss(options?: SplitCssOptions): CssFile[]

  readonly buildInfo: BuildInfoApi
  readonly designSystem: DesignSystemApi

  /**
   * Codegen artifacts.
   */
  writeArtifacts(options: WriteArtifactsOptions): string[]
  writeCss(options: WriteCssOptions): WriteCssResult
  writeLayerCss(options: WriteLayerCssOptions): WriteCssResult
  writeSplitCss(options: WriteSplitCssOptions): WriteFilesResult
  generateArtifacts(options?: GenerateArtifactOptions): CodegenArtifact[]
  generateArtifact(id: CodegenArtifactId, options?: GenerateArtifactOptions): CodegenArtifact | undefined
  generateAffectedArtifacts(dependencies: CodegenDependency[], options?: GenerateArtifactOptions): CodegenArtifact[]

  /**
   * Tooling queries.
   */
  extractFileSource(path: string, source: string): ExtractResult
  inspectFileSource(path: string, source: string): FileInspectionResult
  resolveUtilityValue(input: ResolveUtilityValueInput): ResolvedUtilityValue | null
  suggestTokens(prop: string, value: string): TokenSuggestion[]

  /**
   * Project state views.
   */
  atoms(): Atom[]
  recipes(): RecipeEntry[]
  slotRecipes(): RecipeEntry[]
  encodedRecipes(): EncodedRecipeStyles
  staticPatternAtoms(): StaticPatternResult
  getFile(path: string): ParsedFileView | null
  fileManifest(): CompileFileManifest[]
  summary(): ProjectSummary
  isEmpty(): boolean
}
