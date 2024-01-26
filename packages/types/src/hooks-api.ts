import type { UserConfig } from './config'
import type { RecipeDefinition, RecipeVariantRecord, SlotRecipeDefinition, SlotRecipeVariantRecord } from './recipe'
import type { AtomicStyleResult, RecipeBaseResult } from './style-rules'
import type { SystemStyleObject } from './system-types'

export interface BaseRule {
  getClassNames: () => string[]
  toCss: () => string
}

export interface AtomicRule extends BaseRule {
  styles: SystemStyleObject
}

export interface AtomicRecipeRule extends BaseRule {
  config: RecipeDefinition<any> | SlotRecipeDefinition<string, any>
}

export interface RecipeVariantsRule extends BaseRule {
  variants: RecipeVariantRecord
}

export interface ProcessorInterface {
  css(styles: SystemStyleObject): AtomicRule
  cva(recipeConfig: RecipeDefinition<RecipeVariantRecord>): AtomicRecipeRule
  sva(recipeConfig: SlotRecipeDefinition<string, SlotRecipeVariantRecord<string>>): AtomicRecipeRule
  recipe(name: string, variants?: RecipeVariantRecord): RecipeVariantsRule | undefined
}

export interface HooksApiInterface {
  /**
   * The resolved config (after all the presets are loaded and merged)
   */
  config: UserConfig
  /**
   * The path to the config file
   */
  configPath: string
  /**
   * The list of all the config dependencies (direct/transitive imports) filepaths
   */
  configDependencies: string[]
  //
  /**
   * The processor can be used to generate atomic or recipe classes
   */
  processor: ProcessorInterface
  /**
   * Map that contains all the utility classNames
   */
  classNames: Map<string, string>
  /**
   * Map that contains all the classNames found (and therefore generated) in the app code
   */
  generatedClassNames: Map<string, AtomicStyleResult | RecipeBaseResult>
}
