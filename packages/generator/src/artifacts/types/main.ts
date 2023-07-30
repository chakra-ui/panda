import { outdent } from 'outdent'

export const generateTypesEntry = () => ({
  global: outdent`
    import type { RecipeVariantRecord, RecipeConfig, SlotRecipeVariantRecord, SlotRecipeConfig } from './recipe'
    import type { Parts } from './parts'
    import type { PatternConfig, PatternProperties } from './pattern'
    import type { GlobalStyleObject, SystemStyleObject } from './system-types'
    import type { CompositionStyles } from './composition'

    declare module '@pandacss/dev' {
      export function defineRecipe<V extends RecipeVariantRecord>(config: RecipeConfig<V>): RecipeConfig
      export function defineSlotRecipe<S extends string, V extends SlotRecipeVariantRecord<S>>(config: SlotRecipeConfig<S, V>): SlotRecipeConfig
      export function defineStyles(definition: SystemStyleObject): SystemStyleObject
      export function defineGlobalStyles(definition: GlobalStyleObject): GlobalStyleObject
      export function defineTextStyles(definition: CompositionStyles['textStyles']): CompositionStyles['textStyles']
      export function defineLayerStyles(definition: CompositionStyles['layerStyles']): CompositionStyles['layerStyles']
      export function definePattern<T extends PatternProperties>(config: PatternConfig<T>): PatternConfig
    }
    `,
  index: outdent`
    import './global'
    export type { ConditionalValue } from './conditions'
    export type { GlobalStyleObject, JsxStyleProps, SystemStyleObject } from './system-types'

    `,
  helpers: outdent`
  export type Pretty<T> = T extends infer U ? { [K in keyof U]: U[K] } : never
  `,
})
