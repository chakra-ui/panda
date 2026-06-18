/**
 * TS-facing types that mirror the wasm-bindgen generated interfaces.
 * Kept hand-written (rather than re-exporting from `../pkg-node/*`) so
 * `tsc` typechecks succeed before the wasm artifact is built.
 *
 * The data shapes (`Atom`, `Diagnostic`, `CompileOutput`, …) come from
 * `@pandacss/compiler-shared` — the single contract shared with the native
 * binding. Only the wasm-bindgen *class* shapes live here.
 *
 * Run `pnpm build:wasm` to (re)generate the actual wasm bundle.
 */

import type {
  Atom,
  BuildInfo,
  CodegenArtifact,
  CodegenArtifactId,
  CodegenDependency,
  CssFile,
  StylesheetLayerName,
  CompileFileManifest,
  CompileOptions,
  CompileOutput,
  Diagnostic,
  EncodedRecipeStyles,
  FileInspectionResult,
  LayerNames,
  ScanOptions,
  ParseFileReport,
  ParsedFileView,
  ProjectSummary,
  RecipeEntry,
  ResolveUtilityValueInput,
  ResolvedUtilityValue,
  SerializedHookFilter,
  SourceEntry,
  Spec,
  StaticPatternResult,
  GenerateArtifactOptions,
  WriteArtifactsOptions,
  WriteCssOptions,
  WriteCssResult,
  WriteFilesResult,
  WriteSplitCssOptions,
} from '@pandacss/compiler-shared'

export interface MatcherInput {
  /** Module specifier substrings to match (e.g. `["@panda/css"]`). */
  modules: string[]
  /**
   * Allowed imported names. Omit (or pass `null`) to accept any name —
   * used for recipe/pattern matchers where names are user-defined.
   */
  names?: string[] | null
}

export interface TokenDictionaryInput {
  /** `path → raw value` (e.g. `colors.red.500 → #ef4444`). */
  values: Record<string, string>
  /** `path → CSS var form` (e.g. `colors.red.500 → var(--colors-red-500)`). */
  vars: Record<string, string>
}

export type JsxFramework = 'react' | 'solid' | 'preact' | 'vue' | 'qwik' | (string & {})
export type CssSyntax = 'template-literal' | 'object-literal'

export interface MatchersInput {
  css?: MatcherInput
  recipe?: MatcherInput
  pattern?: MatcherInput
  jsx?: MatcherInput
  tokens?: MatcherInput
  /** Configured JSX framework. Enables JSX-aware extraction diagnostics. */
  jsxFramework?: JsxFramework
  /** Defaults to `["styled"]` when omitted. */
  jsxFactories?: string[]
  /** CSS authoring syntax preference. Omit for object-literal mode. */
  syntax?: CssSyntax
  /** Enable `token('…')` folding by passing a resolved dictionary. */
  tokenDictionary?: TokenDictionaryInput
}

export declare class WasmFileSystem {
  constructor()
  addFile(path: string, content: string): void
  removeFile(path: string): boolean
  readFile(path: string): string | undefined
  exists(path: string): boolean
  fileCount(): number
}

export declare class WasmExtractor {
  constructor(fs: WasmFileSystem, matchers: MatchersInput)
  parseFile(path: string, source: string): unknown
}

/** Stateful compiler handle over a `WasmFileSystem`. Cross-file resolution
 *  always shares the same FS — `import { x } from './tokens'` references
 *  resolve through whatever the JS host has populated.
 *
 *  Mirrors the native `Compiler` class. The TS facade adapts this into the
 *  shared {@link @pandacss/compiler-shared#Compiler} surface (attaching `fs`,
 *  hiding `registerUtilityTransform` / `registerPatternTransform`). */
export declare class WasmCompiler {
  static fromConfig(fs: WasmFileSystem, config: Record<string, unknown>, options?: unknown): WasmCompiler
  config(): Record<string, unknown> | null
  extractFileSource(path: string, source: string): unknown
  parseFile(path: string): ParseFileReport
  parseFileSource(path: string, source: string): ParseFileReport
  refreshFile(path: string): boolean
  refreshFileSource(path: string, source: string): boolean
  removeFile(path: string): boolean
  clear(): void
  scan(options?: ScanOptions): string[]
  realpath(path: string): string
  resolvePath(path: string, cwd?: string): string
  joinPath(parts: string[]): string
  dirname(path: string): string
  isSourceFile(path: string): boolean
  parseFiles(paths: string[]): ParseFileReport[]
  layers(): LayerNames
  hasLayerDeclaration(css: string): boolean
  spec(): Spec
  sources(): SourceEntry[]
  inspectFileSource(path: string, source: string): FileInspectionResult
  resolveUtilityValue(input: ResolveUtilityValueInput): ResolvedUtilityValue | null
  writeArtifacts(options: WriteArtifactsOptions): string[]
  writeCss(options: WriteCssOptions): WriteCssResult
  writeSplitCss(options: WriteSplitCssOptions): WriteFilesResult
  isEmpty(): boolean
  registerUtilityTransform?(id: string, callback: (resolved: unknown, original: unknown) => unknown): void
  registerPatternTransform?(id: string, callback: (props: unknown, helpers: Record<string, unknown>) => unknown): void
  registerSourceTransform?(
    id: string,
    filter: SerializedHookFilter | undefined,
    callback: (filePath: string, content: string) => string | undefined,
  ): void
  atoms(): Atom[]
  recipes(): RecipeEntry[]
  slotRecipes(): RecipeEntry[]
  encodedRecipes(): EncodedRecipeStyles
  summary(): ProjectSummary
  compile(options?: CompileOptions): CompileOutput
  layerCss(layers: StylesheetLayerName[]): string
  splitCss(): CssFile[]
  generateArtifacts(options?: GenerateArtifactOptions): CodegenArtifact[]
  generateArtifact(id: CodegenArtifactId, options?: GenerateArtifactOptions): CodegenArtifact | undefined
  generateAffectedArtifacts(dependencies: CodegenDependency[], options?: GenerateArtifactOptions): CodegenArtifact[]
  diagnostics(): Diagnostic[]
  fileManifest(): CompileFileManifest[]
  /** Per-file view, or `null` when `path` isn't known. */
  getFile(path: string): ParsedFileView | null
  staticPatternAtoms(): StaticPatternResult
  // Flat build-info primitives (the `makeBuildInfoApi` namespace is built over
  // these in `web.ts`, mirroring the native binding).
  serializeBuildInfo(panda: string): BuildInfo
  applyBuildInfo(name: string, buildInfo: BuildInfo, only?: string[]): boolean
  buildInfoSchemaVersion(): number
  configFingerprint(): string
}
