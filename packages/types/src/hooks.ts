import type { LoadConfigResult, UserConfig } from './config'
import type { ParserResultInterface } from './parser'
import type { RecipeDefinition, RecipeVariantRecord, SlotRecipeDefinition, SlotRecipeVariantRecord } from './recipe'
import type { SystemStyleObject } from './system-types'

type MaybeAsyncReturn = Promise<void> | void

interface BaseRule {
  getClassNames: () => string[]
}

interface AtomicRule extends BaseRule {
  styles: SystemStyleObject
}

interface AtomicRecipeRule extends BaseRule {
  config: RecipeDefinition<any> | SlotRecipeDefinition<string, any>
}

interface RecipeRule extends BaseRule {
  variants: RecipeVariantRecord
}

interface ProcessorInterface {
  css(styles: SystemStyleObject): AtomicRule
  cva(recipeConfig: RecipeDefinition<RecipeVariantRecord>): AtomicRecipeRule
  sva(recipeConfig: SlotRecipeDefinition<string, SlotRecipeVariantRecord<string>>): AtomicRecipeRule
  recipe(name: string, variants?: RecipeVariantRecord): RecipeRule | undefined
}

interface ApiInterface {
  config: UserConfig
  processor: ProcessorInterface
}

export interface PandaHooks {
  /**
   * Called when the config is resolved, after all the presets are loaded and merged.
   * This is the first hook called, you can use it to tweak the config before the context is created.
   */
  'config:resolved': (conf: LoadConfigResult) => MaybeAsyncReturn
  /**
   * Called when the Panda context has been created and the API is ready to be used.
   */
  'context:created': (ctx: ApiInterface) => void
  /**
   * Called when the config file or one of its dependencies (imports) has changed.
   */
  'config:change': (ctx: UserConfig) => MaybeAsyncReturn
  /**
   * Called after reading the file content but before parsing it.
   */
  'parser:before': (file: string, content: string) => void
  /**
   * Called after the file styles are extracted and processed into the resulting ParserResult object.
   */
  'parser:after': (file: string, result: ParserResultInterface | undefined) => void
  /**
   * Called before generating the design-system CSS files (global, static, preflight, tokens, keyframes)
   */
  'generator:css': (
    file: 'global.css' | 'static.css' | 'reset.css' | 'tokens.css' | 'keyframes.css' | 'styles.css',
  ) => void
  /**
   * Called after the codegen is completed
   */
  'generator:done': () => MaybeAsyncReturn
}
