import { RecipeVariantRecord, RecipeConfig } from './recipe'
import { GlobalStyleObject } from './system-types'
import { CompositionStyles } from './composition'

declare module '@pandacss/dev' {
  export function defineRecipe<V extends RecipeVariantRecord>(config: RecipeConfig<V>): RecipeConfig<V>
  export function defineGlobalStyles(definition: GlobalStyleObject): GlobalStyleObject
  export function defineTextStyles(definition: CompositionStyles['textStyles']): CompositionStyles['textStyles']
  export function defineLayerStyles(definition: CompositionStyles['layerStyles']): CompositionStyles['layerStyles']
}