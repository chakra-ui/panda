import { outdent } from 'outdent'
import type { Context } from '../../engines'

export const generateTypesEntry = (ctx: Context) => ({
  global: outdent`
    // @ts-nocheck
    import type { TextStyles, LayerStyles } from '@pandacss/dev'
    ${ctx.file.importType('RecipeVariantRecord, RecipeConfig, SlotRecipeVariantRecord, SlotRecipeConfig', './recipe')}
    ${ctx.file.importType('Parts', './parts')}
    ${ctx.file.importType('PatternConfig, PatternProperties', './pattern')}
    ${ctx.file.importType('GlobalStyleObject, SystemStyleObject', './system-types')}
    ${ctx.file.importType('CompositionStyles', './composition')}

    declare module '@pandacss/dev' {
      export function defineRecipe<V extends RecipeVariantRecord>(config: RecipeConfig<V>): RecipeConfig
      export function defineSlotRecipe<S extends string, V extends SlotRecipeVariantRecord<S>>(config: SlotRecipeConfig<S, V>): SlotRecipeConfig
      export function defineStyles(definition: SystemStyleObject): SystemStyleObject
      export function defineGlobalStyles(definition: GlobalStyleObject): GlobalStyleObject
      export function defineTextStyles(definition: CompositionStyles['textStyles']): TextStyles
      export function defineLayerStyles(definition: CompositionStyles['layerStyles']): LayerStyles
      export function definePattern<T extends PatternProperties>(config: PatternConfig<T>): PatternConfig
      export function defineParts<T extends Parts>(parts: T): (config: Partial<Record<keyof T, SystemStyleObject>>) => Partial<Record<keyof T, SystemStyleObject>>
    }
    `,
  index: outdent`
    import '${ctx.file.extDts('./global')}'
    ${ctx.file.exportType('ConditionalValue', './conditions')}
    ${ctx.file.exportType('GlobalStyleObject, JsxStyleProps, SystemStyleObject', './system-types')}

    `,
  helpers: outdent`
  export type Pretty<T> = T extends infer U ? { [K in keyof U]: U[K] } : never
  `,
})
