import type { ImportMapOutput, StylesheetLayerName } from '@pandacss/types'
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
  | 'themes'
  | 'tokens'
  | 'utilities'

export interface GenerateArtifactOptions {
  forceImportExtension?: boolean
  overlay?: CodegenOverlay
}

export interface CodegenOverlay {
  jsx: string
  recipes: string
  patterns: string
  css: string
  helpers: string
  ownedRecipes: string[]
  ownedPatterns: string[]
  virtualizeHelpers: boolean
  virtualizeCss: boolean
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
  id: CodegenArtifactId | (string & {})
  files: CodegenFile[]
}

export interface CompileOptions {
  /**
   * Emit Panda's leading cascade-layer declaration.
   */
  emitLayerDeclaration?: boolean
  /**
   * Override config-level minification for this compile.
   */
  minify?: boolean
  /** Override config-level cascade-layer polyfill for this compile. */
  polyfill?: boolean
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
  polyfill?: boolean
}

export interface LayerCssOptions {
  layers: StylesheetLayerName[]
  emitLayerDeclaration?: boolean
  minify?: boolean
  polyfill?: boolean
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

export interface SplitCssResult {
  files: CssFile[]
  diagnostics: Diagnostic[]
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

export interface WriteSplitCssResult extends SplitCssResult {
  root: string
  paths: string[]
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
  cssProperty: string | null
  mappedCssProperty: string | null
  tokenCategory: string | null
  literals: string[]
  primitive: SpecPrimitiveType | null
  alias: string
}

export type SpecPrimitiveType = 'string' | 'number' | 'boolean'

export type SpecValueTypePart =
  | { kind: 'tokenCategory'; value: string }
  | { kind: 'cssProperty'; value: string }
  | { kind: 'literal'; value: string }
  | { kind: 'primitive'; value: SpecPrimitiveType }
  | { kind: 'cssVars' }
  | { kind: 'anyString' }
  | { kind: 'anyNumber' }

export interface SpecValueAlias {
  name: string
  parts: SpecValueTypePart[]
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

export type SpecConditionDefinition = string | { [key: string]: SpecConditionDefinition }

export type SpecJsxSpecifier = string | { kind: 'regex'; source: string; flags: string }

export interface SpecTokenValue {
  value: string
  condition?: string
  originalValue?: string
  description?: string
  deprecated?: Deprecation
}

export interface SpecTokenDefinition {
  path: string
  category: string
  cssVar: string
  semantic: boolean
  values: SpecTokenValue[]
}

export type SpecVariantSelection = string | number | boolean | SpecVariantSelection[]

export interface SpecCompoundVariantDefinition {
  css: unknown
  className?: string
  [variant: string]: unknown
}

export interface SpecRecipeDefinition {
  name: string
  className: string
  description?: string
  jsx: SpecJsxSpecifier[]
  slots?: string[]
  base?: unknown
  variants: Record<string, Record<string, unknown>>
  defaultVariants: Record<string, SpecVariantSelection>
  compoundVariants: SpecCompoundVariantDefinition[]
  staticCss?: unknown
  deprecated?: Deprecation
  metadata?: Record<string, unknown>
}

export interface SpecPatternPropertyDefinition {
  type?: string
  value?: unknown
  property?: string
  description?: string
  metadata?: Record<string, unknown>
}

export interface SpecPatternDefinition {
  name: string
  jsxName: string
  jsxElement: string
  jsx: SpecJsxSpecifier[]
  description?: string
  properties: Record<string, SpecPatternPropertyDefinition>
  defaultValues?: unknown
  hasDynamicDefaultValues: boolean
  hasTransform: boolean
  strict: boolean
  blocklist: string[]
  deprecated?: Deprecation
  metadata?: Record<string, unknown>
}

export interface SpecThemeDefinition {
  name: string
  condition: string
  rootSelector: string
}

export interface SpecCatalog {
  conditions: Record<string, SpecConditionDefinition>
  tokens: Record<string, SpecTokenDefinition>
  recipes: Record<string, SpecRecipeDefinition>
  slotRecipes: Record<string, SpecRecipeDefinition>
  patterns: Record<string, SpecPatternDefinition>
  keyframes: Record<string, unknown>
  textStyles: Record<string, unknown>
  layerStyles: Record<string, unknown>
  animationStyles: Record<string, unknown>
  viewTransitions: Record<string, unknown>
  positionTry: Record<string, unknown>
  themes: Record<string, SpecThemeDefinition>
}

export interface Spec {
  schemaVersion: number
  options: {
    strictTokens: boolean
    strictPropertyValues: boolean
    jsxStyleProps: 'all' | 'minimal' | 'none'
  }
  conditions: { keys: string[]; breakpoints: string[]; containers: string[] }
  selectors: { selectors: string[]; arbitrary: string[] }
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
    aliases: Record<string, SpecValueAlias>
    classNames: Record<string, string>
  }
  keyframes: { keys: string[] }
  patterns: Record<string, SpecPattern>
  recipes: Record<string, SpecRecipe>
  slotRecipes: Record<string, SpecSlotRecipe>
  propertyOrder: string[]
  jsxFactory: string | null
  importMap: ImportMapOutput | null
  catalog: SpecCatalog
}
