import type { Dict, PatternHelpers, RecipeConfig, SlotRecipeConfig, UserConfig } from '@pandacss/types'
import type { CoreContext } from './core-context'
import type { Layers } from './layers'

export type RecipeContext = Pick<StylesheetContext, 'utility' | 'conditions'>

export interface TransformResult {
  layer?: string
  className: string
  styles: Dict
}

export interface StylesheetContext
  extends Pick<CoreContext, 'utility' | 'conditions' | 'encoder' | 'decoder' | 'isValidProperty'> {
  layers: Layers
  helpers: PatternHelpers
  hash?: boolean
  lightningcss?: boolean
  browserslist?: string[]
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

export interface CssOptions extends Pick<UserConfig, 'optimize' | 'minify'> {}

export interface ProcessOptions {
  styles: Dict
  layer: LayerName
}

export type LayerName =
  | 'base'
  | 'reset'
  | 'recipes_slots_base'
  | 'recipes_base'
  | 'tokens'
  | 'recipes'
  | 'utilities'
  | 'recipes_slots'
  | 'compositions'
