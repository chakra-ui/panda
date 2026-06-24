import type { Diagnostic } from './diagnostics'
import type { CodegenArtifact } from './codegen'

export interface WriteCssOptions extends CompileOptions {
  outfile: string
  cwd?: string
}

/** CSS emit overrides shared by cssgen, build, and dev. */
export interface CssOutputOptions {
  /** Layer filter for split output. Omit to emit all layers. */
  layers?: StylesheetLayerName[]
  emitLayerDeclaration?: boolean
  minify?: boolean
}

/** Options for {@link Compiler.getLayerCss} / {@link Driver.getLayerCss}. */
export interface LayerCssOptions {
  layers: StylesheetLayerName[]
  emitLayerDeclaration?: boolean
  minify?: boolean
}

/** Options for in-memory split CSS generation. */
export type SplitCssOptions = CssOutputOptions

export interface WriteLayerCssOptions extends LayerCssOptions {
  outfile: string
  cwd?: string
}

export interface WriteSplitCssOptions extends CssOutputOptions {
  outdir?: string
  cwd?: string
}

/** One split CSS file, relative to `outdir`. */
export interface CssFile {
  path: string
  code: string
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

export interface WriteCssResult extends CompileOutput {
  path: string
}

export interface WriteFilesResult {
  root: string
  paths: string[]
  files: CssFile[]
}

export interface CompileOptions {
  /** Emit Panda's leading cascade-layer order declaration (`@layer reset, ...;`). */
  emitLayerDeclaration?: boolean
  /** Override config `minify` for this compile. */
  minify?: boolean
}

/** Scan overrides for `Compiler.scan`/`parseFiles`. Omitted fields fall back to the
 *  config's `include`/`exclude`/`cwd`. */
export interface ScanOptions {
  include?: string[]
  exclude?: string[]
  cwd?: string
}

/** A source glob with its static base directory (the dir a watcher subscribes to). */
export interface SourceEntry {
  base: string
  pattern: string
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
