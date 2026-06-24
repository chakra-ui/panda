import type { Diagnostic, SourceRange, Span } from './diagnostics'

export type MatchCategory = 'css' | 'recipe' | 'pattern' | 'jsx' | 'tokens'

/** One atomic style declaration. Conditions are outer→inner; unconditional
 *  atoms have an empty array. */
export interface Atom {
  prop: string
  value: string | number | boolean | null
  conditions: string[]
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

/** Fine-grained JSX classification: a styled factory (`<styled.div>`), a
 *  pattern component (`<Stack>`), a recipe component (`<Button>`), or a plain
 *  configured component. */
export type JsxKind = 'factory' | 'pattern' | 'recipe' | 'component'

export interface ExtractedJsx {
  category: MatchCategory
  /** Origin of the component — distinguishes jsx-factory/pattern/recipe. */
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
  /** `true` when the call was `token.var(...)` rather than `token(...)`. */
  isVar: boolean
  resolved: boolean
  category?: string
}

export type UsageKind = 'token' | 'property' | 'recipe' | 'pattern' | 'keyframe'

/** One classified Panda usage with its source range — for reporting, lint, IDE.
 *  `name` is a token path, canonical property, or recipe/pattern name. */
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
  /** Enclosing `css()`/recipe call or JSX element; `(owner, parent path)` is one style block. */
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
  /** Source span of each string leaf, so fixers can target the exact literal. */
  valueSpans?: { value: string; span: Span }[]
}

/** An extracted call/JSX with a resolved source range, for inspection consumers. */
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
