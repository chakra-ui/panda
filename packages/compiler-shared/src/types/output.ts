import type { ImportMapOutput } from './config'
import type { Diagnostic } from './diagnostics'

export type CodegenArtifactId =
  | 'conditions'
  | 'css-index'
  | 'cx'
  | 'helpers'
  | 'jsx-create-recipe-context'
  | 'jsx-create-slot-recipe-context'
  | 'jsx-factory'
  | 'jsx-index'
  | 'jsx-is-valid-prop'
  | 'jsx-patterns'
  | 'patterns'
  | 'themes'
  | 'types'

export type CodegenDependency =
  | 'outExtension'
  | 'forceImportExtension'
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
  forceImportExtension?: boolean
}

export interface CodegenOptions extends GenerateArtifactOptions {
  outdir?: string
  cwd?: string
}

export interface WriteArtifactsOptions extends GenerateArtifactOptions {
  outdir: string
  cwd?: string
  artifacts?: CodegenArtifact[]
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

/**
 * The five cascade layers, in emit order.
 */
export type StylesheetLayerName = 'reset' | 'base' | 'tokens' | 'recipes' | 'utilities'

export interface CompileOptions {
  /**
   * Emit Panda's leading cascade-layer declaration.
   */
  emitLayerDeclaration?: boolean
  /**
   * Override config-level minification for this compile.
   */
  minify?: boolean
}

/**
 * CSS emit overrides shared by cssgen, build, and dev.
 */
export interface CssOutputOptions {
  /**
   * Layer filter for split output. Omit to emit every layer.
   */
  layers?: StylesheetLayerName[]
  emitLayerDeclaration?: boolean
  minify?: boolean
}

export interface LayerCssOptions {
  layers: StylesheetLayerName[]
  emitLayerDeclaration?: boolean
  minify?: boolean
}

export type SplitCssOptions = CssOutputOptions

export interface WriteCssOptions extends CompileOptions {
  outfile: string
  cwd?: string
}

export interface WriteLayerCssOptions extends LayerCssOptions {
  outfile: string
  cwd?: string
}

export interface WriteSplitCssOptions extends CssOutputOptions {
  outdir?: string
  cwd?: string
}

export interface CssFile {
  /**
   * Path relative to the requested output directory.
   */
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

export interface ScanOptions {
  /**
   * Omitted fields fall back to the compiled config.
   */
  include?: string[]
  exclude?: string[]
  cwd?: string
}

/**
 * A source glob plus the static base directory a watcher can subscribe to.
 */
export interface SourceEntry {
  base: string
  pattern: string
}

export interface LayerNames {
  reset: string
  base: string
  tokens: string
  recipes: string
  utilities: string
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

export type Deprecation = true | string

export interface SpecVariant {
  values: string[]
  allowsBoolean: boolean
}

export interface SpecRecipe {
  name: string
  typeName: string
  variants: Record<string, SpecVariant>
  deprecated?: Deprecation
}

export interface SpecSlotRecipe extends SpecRecipe {
  slots: string[]
}

export interface SpecPattern {
  name: string
  typeName: string
  strict: boolean
  blocklist: string[]
  properties: Record<string, unknown>
  deprecated?: Deprecation
}

export interface Spec {
  conditions: { keys: string[]; breakpoints: string[]; containers: string[] }
  tokens: {
    categories: Record<string, SpecTokenCategory>
    colorPalettes: string[]
    values: Record<string, string>
    deprecated: Record<string, Deprecation>
  }
  utilities: {
    properties: Record<string, SpecUtilityProperty>
    shorthands: Record<string, string>
    deprecated: Record<string, Deprecation>
  }
  keyframes: { keys: string[] }
  patterns: Record<string, SpecPattern>
  recipes: Record<string, SpecRecipe>
  slotRecipes: Record<string, SpecSlotRecipe>
  propertyOrder: string[]
  jsxFactory?: string
  importMap?: ImportMapOutput
}
