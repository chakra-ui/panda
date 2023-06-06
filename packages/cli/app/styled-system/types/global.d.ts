import { RecipeVariantRecord, RecipeConfig } from './recipe'
import { Parts } from './parts'
import { PatternConfig } from './pattern'
import { GlobalStyleObject, SystemStyleObject } from './system-types'
import { CompositionStyles } from './composition'

declare module '@pandacss/dev' {
  export function defineRecipe<V extends RecipeVariantRecord>(config: RecipeConfig<V>): RecipeConfig
  export function defineStyles(definition: SystemStyleObject): SystemStyleObject
  export function defineGlobalStyles(definition: GlobalStyleObject): GlobalStyleObject
  export function defineTextStyles(definition: CompositionStyles['textStyles']): CompositionStyles['textStyles']
  export function defineLayerStyles(definition: CompositionStyles['layerStyles']): CompositionStyles['layerStyles']
  export function definePattern<T>(config: PatternConfig<T>): PatternConfig
  export function defineParts<T extends Parts>(parts: T): (config: Partial<Record<keyof T, SystemStyleObject>>) => Partial<Record<keyof T, SystemStyleObject>>;
}