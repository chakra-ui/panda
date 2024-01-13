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

export interface RecipeRule extends BaseRule {
  variants: RecipeVariantRecord
}

export interface ProcessorInterface {
  css(styles: SystemStyleObject): AtomicRule
  cva(recipeConfig: RecipeDefinition<RecipeVariantRecord>): AtomicRecipeRule
  sva(recipeConfig: SlotRecipeDefinition<string, SlotRecipeVariantRecord<string>>): AtomicRecipeRule
  recipe(name: string, variants?: RecipeVariantRecord): RecipeRule | undefined
}

export interface ApiInterface {
  config: UserConfig
  processor: ProcessorInterface
  classNames: Map<string, AtomicStyleResult | RecipeBaseResult>
}
