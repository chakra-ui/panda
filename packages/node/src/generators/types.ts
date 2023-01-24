import { allCssProperties } from '@pandacss/is-valid-prop'
import { readFileSync } from 'fs-extra'
import outdent from 'outdent'
import type { PandaContext } from '../context'
import { getEntrypoint } from './get-entrypoint'

function getType(file: string) {
  const filepath = getEntrypoint('@pandacss/types', { dev: file })
  return readFileSync(filepath, 'utf8')
}

export function generateCssType(ctx: PandaContext) {
  const propList = new Set(allCssProperties.concat(ctx.utility.keys()))
  return {
    css: getType('csstype.d.ts'),
    system: getType('system-types.d.ts'),
    selectors: getType('selectors.d.ts'),
    recipe: getType('recipe.d.ts'),
    composition: getType('composition.d.ts'),
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
    exported: outdent`
    import './global'
    export { ConditionalValue } from './conditions'
    export { GlobalStyleObject, JsxStyleProps, SystemStyleObject } from './system-types'
    
    export type Assign<Target, Override> = Omit<Target, keyof Override> & Override
    `,
    styleProps: outdent`
    import { PropertyValue } from './prop-type'
    import { Token } from './token'

    type CssVarProperties = {
      [key in \`--\${string}\`]?: Token | (string & {}) | (number & {})
    }
  
    export type SystemProperties = CssVarProperties & {
      ${Array.from(propList)
        .map((v) => `\t${v}?: PropertyValue<'${v}'>`)
        .join('\n')}
    }
    `,
  }
}
