import type { ImportMapOutput } from './config'

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

/** Tooling introspection snapshot — read once, index on the host (never query
 *  the engine per-item in a hot loop). Powers reporting / formatting / linting. */
/** `true` = deprecated with no message; a string = the author's deprecation message. */
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
    /** `path -> value` (empty value means it equals the token's CSS var). */
    values: Record<string, string>
    /** `token path -> deprecation` (`true` or an author message). */
    deprecated: Record<string, Deprecation>
  }
  utilities: {
    properties: Record<string, SpecUtilityProperty>
    /** `shorthand -> canonical property`. */
    shorthands: Record<string, string>
    /** `property -> deprecation` (always `true`; utility config has no message). */
    deprecated: Record<string, Deprecation>
  }
  /** Keyed by pattern name. */
  patterns: Record<string, SpecPattern>
  /** Keyed by recipe name. */
  recipes: Record<string, SpecRecipe>
  /** Keyed by slot-recipe name. */
  slotRecipes: Record<string, SpecSlotRecipe>
  /** Canonical emit order for property names (for a stable property sort). */
  propertyOrder: string[]
  jsxFactory?: string
  /** Normalized import map. */
  importMap?: ImportMapOutput
}
