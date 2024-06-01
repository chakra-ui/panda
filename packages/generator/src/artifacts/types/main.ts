import { ArtifactFile } from '../artifact'

export const typesGlobalArtifact = new ArtifactFile({
  id: 'types/global.d.ts',
  fileName: 'index',
  type: 'dts',
  dir: (ctx) => ctx.paths.types,
  dependencies: ['types'],
  importsType: {
    'types/recipe.d.ts': ['RecipeVariantRecord, RecipeConfig, SlotRecipeVariantRecord, SlotRecipeConfig'],
    'types/pattern.d.ts': ['PatternConfig, PatternProperties'],
    'types/system-types.d.ts': ['GlobalStyleObject, SystemStyleObject'],
    'types/composition.d.ts': ['CompositionStyles'],
    'types/parts.d.ts': ['Parts'],
  },
  code() {
    return `// @ts-nocheck
    import type * as Panda from '@pandacss/dev'

    declare module '@pandacss/dev' {
      export function defineRecipe<V extends RecipeVariantRecord>(config: RecipeConfig<V>): Panda.RecipeConfig
      export function defineSlotRecipe<S extends string, V extends SlotRecipeVariantRecord<S>>(config: SlotRecipeConfig<S, V>): Panda.SlotRecipeConfig
      export function defineStyles(definition: SystemStyleObject): SystemStyleObject
      export function defineGlobalStyles(definition: GlobalStyleObject): Panda.GlobalStyleObject
      export function defineTextStyles(definition: CompositionStyles['textStyles']): Panda.TextStyles
      export function defineLayerStyles(definition: CompositionStyles['layerStyles']): Panda.LayerStyles
      export function definePattern<T extends PatternProperties>(config: PatternConfig<T>): Panda.PatternConfig
      export function defineParts<T extends Parts>(parts: T): (config: Partial<Record<keyof T, SystemStyleObject>>) => Partial<Record<keyof T, SystemStyleObject>>
    }`
  },
})

export const typesIndexArtifact = new ArtifactFile({
  id: 'types/index.d.ts',
  fileName: 'index',
  type: 'dts',
  dir: (ctx) => ctx.paths.types,
  dependencies: ['types'],
  computed(ctx) {
    return {
      isJsxRequired: Boolean(ctx.jsx.framework),
    }
  },
  code(params) {
    const indexExports = [
      // We need to export types used in the global.d.ts here to avoid TS errors such as `The inferred type of 'xxx' cannot be named without a reference to 'yyy'`
      `import '${params.file.extDts('./global')}'`,
      params.file.exportTypeStar('./conditions'),
      params.file.exportTypeStar('./pattern'),
      params.file.exportTypeStar('./recipe'),
      params.file.exportTypeStar('./system-types'),
      params.computed.isJsxRequired && params.file.exportTypeStar('./jsx'),
      params.file.exportTypeStar('./style-props'),
    ].filter(Boolean)

    return indexExports.join('\n')
  },
})
