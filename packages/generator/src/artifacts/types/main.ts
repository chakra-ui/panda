import { outdent } from 'outdent'

export const generateTypesEntry = () => ({
  global: outdent`
    import { RecipeVariantRecord, RecipeConfig } from './recipe'
    import { GlobalStyleObject } from './system-types'
    import { CompositionStyles } from './composition'
    
    declare module 'css-panda' {
      export function defineRecipe<V extends RecipeVariantRecord>(config: RecipeConfig<V>): RecipeConfig<V>
      export function defineGlobalStyles(definition: GlobalStyleObject): GlobalStyleObject
      export function defineTextStyles(definition: CompositionStyles['textStyles']): CompositionStyles['textStyles']
      export function defineLayerStyles(definition: CompositionStyles['layerStyles']): CompositionStyles['layerStyles']
    }
    `,
  index: outdent`
    import './global'
    export { ConditionalValue } from './conditions'
    export { GlobalStyleObject, JsxStyleProps, SystemStyleObject } from './system-types'
    
    export type Assign<Target, Override> = Omit<Target, keyof Override> & Override
    `,
})
