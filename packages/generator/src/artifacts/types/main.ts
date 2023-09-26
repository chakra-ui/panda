import { outdent } from 'outdent'
import type { Context } from '../../engines'

export const generateTypesEntry = (ctx: Context) => ({
  global: outdent`
    // @ts-nocheck
    import type * as Panda from '@pandacss/dev'
    ${ctx.file.importType('RecipeVariantRecord, RecipeConfig, SlotRecipeVariantRecord, SlotRecipeConfig', './recipe')}
    ${ctx.file.importType('Parts', './parts')}
    ${ctx.file.importType('PatternConfig, PatternProperties', './pattern')}
    ${ctx.file.importType('GlobalStyleObject, SystemStyleObject', './system-types')}
    ${ctx.file.importType('CompositionStyles', './composition')}

    declare module '@pandacss/dev' {
      export function defineRecipe<V extends RecipeVariantRecord>(config: RecipeConfig<V>): Panda.RecipeConfig
      export function defineSlotRecipe<S extends string, V extends SlotRecipeVariantRecord<S>>(config: SlotRecipeConfig<S, V>): Panda.SlotRecipeConfig
      export function defineStyles(definition: SystemStyleObject): SystemStyleObject
      export function defineGlobalStyles(definition: GlobalStyleObject): Panda.GlobalStyleObject
      export function defineTextStyles(definition: CompositionStyles['textStyles']): Panda.TextStyles
      export function defineLayerStyles(definition: CompositionStyles['layerStyles']): Panda.LayerStyles
      export function definePattern<T extends PatternProperties>(config: PatternConfig<T>): Panda.PatternConfig
      export function defineParts<T extends Parts>(parts: T): (config: Partial<Record<keyof T, SystemStyleObject>>) => Partial<Record<keyof T, SystemStyleObject>>
    }
    `,
  // We need to export types used in the global.d.ts here to avoid TS errors such as `The inferred type of 'xxx' cannot be named without a reference to 'yyy'`
  index: outdent`
    import '${ctx.file.extDts('./global')}'
    ${ctx.file.exportTypeStar('./conditions')}
    ${ctx.file.exportTypeStar('./pattern')}
    ${ctx.file.exportTypeStar('./recipe')}
    ${ctx.file.exportTypeStar('./system-types')}
    ${ctx.file.exportTypeStar('./jsx')}
    ${ctx.file.exportTypeStar('./style-props')}

    `,
  helpers: outdent`
  export type Pretty<T> = T extends infer U ? { [K in keyof U]: U[K] } : never
  `,
})
