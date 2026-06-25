import type { Diagnostic, SourceRange, Span } from './diagnostics'

export type MatchCategory = 'css' | 'recipe' | 'pattern' | 'jsx' | 'tokens'

/**
 * One atomic style declaration. Conditions are outer to inner.
 */
export interface Atom {
  prop: string
  value: string | number | boolean | null
  conditions: string[]
}

/**
 * Distinguishes a literal `null` from a non-extractable argument.
 */
export type ExtractedArg = { kind: 'value'; value: unknown } | { kind: 'missing'; value?: undefined }

export interface ExtractedConditional {
  kind: 'conditional'
  branches: unknown[]
}

export interface ExtractedCall {
  category: MatchCategory
  /**
   * Canonical Panda name; for `p.css(...)`, the property name.
   */
  name: string
  /**
   * Local binding at the call site; namespace alias for `p.css(...)`.
   */
  alias: string
  /**
   * One entry per source argument, in order.
   */
  data: ExtractedArg[]
  span: Span
}

/**
 * JSX origin classification for factories, patterns, recipes, and configured components.
 */
export type JsxKind = 'factory' | 'pattern' | 'recipe' | 'component'

export interface ExtractedJsx {
  category: MatchCategory
  kind: JsxKind
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

export interface TokenRefSite {
  path: string
  span: Span
  range: SourceRange
  needsCssVar: boolean
  /**
   * True when the call was `token.var(...)` rather than `token(...)`.
   */
  isVar: boolean
  resolved: boolean
  category?: string
}

export type UsageKind = 'token' | 'property' | 'recipe' | 'pattern' | 'keyframe'

export interface UsageSite {
  kind: UsageKind
  name: string
  range: SourceRange
}

export type ComponentEntryKind = 'jsx-component' | 'jsx-pattern' | 'jsx-recipe' | 'jsx-slot-recipe'

export interface ComponentEntryRef {
  kind: ComponentEntryKind
  name: string
  span: Span
  range: SourceRange
  recipe?: string
  slot?: string
  pattern?: string
}

export type StyleEntryKind = 'utility' | 'condition' | 'selector' | 'recipe-variant' | 'pattern-prop' | 'unknown'
export type StyleEntrySyntax =
  | 'css-call'
  | 'jsx-prop'
  | 'jsx-style-prop'
  | 'recipe-call'
  | 'pattern-call'
  | 'template-style'
export type StyleEntryOrigin = 'local' | 'cross-file' | 'generated' | 'unknown'
export type StyleEntryFixability = 'report-only' | 'safe'

export interface StyleEntryRef {
  kind: StyleEntryKind
  syntax: StyleEntrySyntax
  /**
   * Enclosing call or JSX element; `(owner, path)` identifies one style block.
   */
  owner: { kind: 'call' | 'jsx'; index: number }
  origin: StyleEntryOrigin
  span: Span
  range: SourceRange
  keySpan?: Span
  valueSpan?: Span
  path: string[]
  name: string
  canonicalName?: string
  shorthandOf?: string
  sourceValue: unknown
  resolvedValue: unknown
  fixable: StyleEntryFixability
  /**
   * Source spans for string leaves, used by precise fixers.
   */
  valueSpans?: { value: string; span: Span }[]
}

export interface InspectionCall extends ExtractedCall {
  range: SourceRange
}
export interface InspectionJsx extends ExtractedJsx {
  range: SourceRange
}

export interface FileInspectionResult {
  usages: UsageSite[]
  diagnostics: Diagnostic[]
  calls: InspectionCall[]
  jsx: InspectionJsx[]
  tokenRefs: TokenRefSite[]
  componentEntries: ComponentEntryRef[]
  styleEntries: StyleEntryRef[]
}

export type UtilityValueInput = string | number | boolean | null

export type UtilityResolvedScalar = string | number | boolean

export type UtilityValueSource =
  | { type: 'value-map'; key: string; aliases: string[] }
  | { type: 'literal'; aliases: string[] }
  | { type: 'token-reference' }
  | { type: 'arbitrary' }

export interface ResolveUtilityValueInput {
  prop: string
  value: UtilityValueInput
}

export interface ResolvedUtilityValue {
  utility: string
  className: string
  cssValue: UtilityResolvedScalar
  important: boolean
  source: UtilityValueSource
}

export interface TokenSuggestion {
  /**
   * Category-relative path, for example `red.500` or `fg.error`.
   */
  token: string
  semantic: boolean
  conditional: boolean
}

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

export interface RecipeEntry {
  file: string
  spanStart: number
  /**
   * Serialized `pandacss_recipes::Recipe` or slot recipe shape.
   */
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
  path: string
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
