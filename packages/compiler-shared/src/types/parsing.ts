import type { Diagnostic } from './diagnostics'
import type { Atom } from './extraction'
import type { RecipeEntry } from './recipes'

export interface ParseFileReport {
  /** Source path parsed for this report. */
  path: string
  /** Number of `css(...)` calls extracted from this file. */
  cssCalls: number
  /** Number of `cva(...)` recipe calls extracted from this file. */
  cvaCalls: number
  /** Number of `sva(...)` slot-recipe calls extracted from this file. */
  svaCalls: number
  /** Number of JSX style usages extracted from this file. */
  jsxUsages: number
  /** Diagnostics produced while parsing this file. */
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
