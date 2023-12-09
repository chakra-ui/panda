import type { Dict, PatternHelpers, RecipeConfig, SlotRecipeConfig } from '@pandacss/types'
import type { Conditions } from './conditions'
import type { Layers } from './layers'
import type { Recipes } from './recipes'
import type { Utility } from './utility'

export type RecipeContext = Pick<StylesheetContext, 'utility' | 'conditions' | 'layers'>

export type AtomicRuleContext = Pick<StylesheetContext, 'conditions' | 'hash' | 'utility' | 'transform' | 'layers'>

export interface TransformResult {
  layer?: string
  className: string
  styles: Dict
}

type AtomicRuleTransform = (prop: string, value: any) => TransformResult

export interface StylesheetContext {
  layers: Layers
  utility: Utility
  conditions: Conditions
  recipes: Recipes
  helpers: PatternHelpers
  hash?: boolean
  transform?: AtomicRuleTransform
}

export interface RecipeNode {
  /**
   * The name of the recipe
   */
  baseName: string
  /**
   * Discriminant
   */
  type: 'recipe'
  /**
   * The keys of the variants
   */
  variantKeys: string[]
  /**
   * The map of the variant keys to their possible values
   */
  variantKeyMap: Record<string, string[]>
  /**
   * The jsx keys or regex to match the recipe
   */
  jsx: (string | RegExp)[]
  /**
   * The name of the recipe in upper case
   */
  upperName: string
  /**
   * The name of the recipe in dash case
   */
  dashName: string
  /**
   * The name of the recipe in camel case
   */
  jsxName: string
  /**
   * The regex to match the recipe
   */
  match: RegExp
  /**
   * The transformed recipe config
   */
  config: RecipeConfig | SlotRecipeConfig
  /**
   * The function to split the props
   */
  splitProps: (props: Dict) => [Dict, Dict]
  /**
   * The props of the recipe
   */
  props: string[]
}
