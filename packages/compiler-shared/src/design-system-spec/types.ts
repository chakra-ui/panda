/**
 * `styled-system/specs/design-system.json`, written by the Rust engine
 * (`crates/pandacss_codegen/src/artifacts/specs.rs`) for tooling that has no
 * compiler. `schemaVersion` keeps the two sides honest.
 */

export interface DesignSystemSpec {
  schemaVersion: number
  /** Category to `[from, to)` range into {@link DesignSystemSpec.paths}. */
  categories: Record<string, [number, number]>
  /** Render order: grouped by category, then sorted. */
  paths: string[]
  tokens: Record<string, DesignSystemToken>
  /** Raw query as configured. */
  conditions: Record<string, unknown>
  themes: Record<string, DesignSystemTheme>
  /** Keyed and sorted by `(token, theme, condition)`. */
  values: DesignSystemValue[]
  /** Every section below is absent when the system defines none of it. */
  colorPalettes?: string[]
  keyframes?: string[]
  textStyles?: Record<string, DesignSystemStyle>
  layerStyles?: Record<string, DesignSystemStyle>
  animationStyles?: Record<string, DesignSystemStyle>
  recipes?: Record<string, DesignSystemRecipe>
  slotRecipes?: Record<string, DesignSystemSlotRecipe>
  patterns?: Record<string, DesignSystemPattern>
  /** Absent unless source tracking was on. */
  sources?: DesignSystemSources
}

export interface DesignSystemStyle {
  description?: string
}

export interface DesignSystemVariant {
  values: string[]
  /** A `true`/`false` variant, usable as a bare boolean prop. */
  allowsBoolean: boolean
}

export interface DesignSystemRecipe {
  className?: string
  variants: Record<string, DesignSystemVariant>
  defaultVariants?: Record<string, unknown>
  deprecated?: boolean | string
  description?: string
}

export interface DesignSystemSlotRecipe extends DesignSystemRecipe {
  slots: string[]
}

export type DesignSystemPatternProperty = { description?: string } & (
  | { kind: 'enum'; values: string[] }
  | { kind: 'token'; category: string; property?: string }
  | { kind: 'property'; property: string }
  | { kind: 'primitive'; primitive: 'string' | 'number' | 'boolean' }
  | { kind: 'unknown' }
)

export interface DesignSystemPattern {
  jsxName: string
  /** Regex matchers are not listed. */
  jsx?: string[]
  properties: Record<string, DesignSystemPatternProperty>
  /** Static defaults only; a function default has no serial form. */
  defaultValues?: Record<string, unknown>
  strict: boolean
  blocklist?: string[]
  deprecated?: boolean | string
  description?: string
}

/** Presets first, the user's config last. */
export interface DesignSystemSourceEntry {
  kind: 'config' | 'preset'
  name?: string
  specifier?: string
  /** Relative to the project root. */
  file?: string
}

/** Tokens and themes carry their own `source`; conditions have no row, so theirs live here. */
export interface DesignSystemSources {
  entries: DesignSystemSourceEntry[]
  conditions?: Record<string, number>
}

export interface DesignSystemToken {
  category: string
  /** Absent for derived tokens. */
  cssVar?: string
  /** The value before reference expansion or derivation, when one was retained. */
  originalValue?: string
  description?: string
  deprecated?: boolean
  deprecatedReason?: string
  semantic?: boolean
  /** Index into {@link DesignSystemSources.entries}. Absent when unplaceable. */
  source?: number
}

export interface DesignSystemTheme {
  id: string
  selector: string | null
  source?: number
}

/** One resolved value. No `condition` and no `theme` means the base value. */
export interface DesignSystemValue {
  token: string
  condition?: string
  theme?: string
  value: string
  /** Token paths this value reaches through `var(--…)`. */
  refs?: string[]
}
