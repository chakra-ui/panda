import type { CascadeLayers, Dict, PatternHelpers, RecipeConfig, SlotRecipeConfig } from '@pandacss/types'
import type { Root } from 'postcss'
import type { Conditions } from './conditions'
import type { Utility } from './utility'

export type TransformResult = {
  layer?: string
  className: string
  styles: Dict
}

type AtomicRuleTransform = (prop: string, value: any) => TransformResult

export type StylesheetContext = {
  root: Root
  utility: Utility
  conditions: Conditions
  helpers: PatternHelpers
  hash?: boolean
  transform?: AtomicRuleTransform
  layers: CascadeLayers
}

export type RecipeNode = {
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
