import { unionType } from '@pandacss/shared'
import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generateRecipes(ctx: Context) {
  const {
    recipes,
    utility: { separator },
    config: { prefix, hash },
  } = ctx

  if (recipes.isEmpty()) return

  const createRecipeFn = {
    name: 'create-recipe',
    dts: '',
    js: outdent`
   ${ctx.file.import('createCss, withoutSpace, compact', '../helpers')}

   export const createRecipe = (name, defaultVariants) => {
     return (variants) => {
      const transform = (prop, value) => {
         if (value === '__ignore__') {
           return { className: name }
         }
 
         value = withoutSpace(value)
         return { className: \`\${name}--\${prop}${separator}\${value}\` }
      }
      
      const context = {
        hash: ${hash ? 'true' : 'false'},
        utility: {
          prefix: ${prefix ? JSON.stringify(prefix) : undefined},
          transform,
        }
      }
      
      const css = createCss(context)
      
      return css({
        [name]: '__ignore__',
        ...defaultVariants,
        ...compact(variants)
      })
     }
   }
  `,
  }

  return [
    createRecipeFn,
    ...ctx.recipes.details.map((recipe) => {
      const { config, upperName, variantKeyMap, dashName } = recipe
      const { name, description, defaultVariants } = config

      return {
        name: dashName,

        js: outdent`
        ${ctx.file.import('createRecipe', './create-recipe')}

        export const ${name} = createRecipe('${name}', ${JSON.stringify(defaultVariants ?? {})})
        ${name}.variants = ${JSON.stringify(variantKeyMap)}
        `,

        dts: outdent`
        import type { ConditionalValue } from '../types'

        type ${upperName}Variant = {
          ${Object.keys(variantKeyMap)
            .map((key) => `${key}: ${unionType(variantKeyMap[key])}`)
            .join('\n')}
        }
    
        type ${upperName}VariantMap = {
          [key in keyof ${upperName}Variant]: Array<${upperName}Variant[key]>
        }
    
        export type ${upperName}Variants = {
          [key in keyof ${upperName}Variant]?: ConditionalValue<${upperName}Variant[key]>
        }
    
        ${description ? `/** ${description} */` : ''}
        export declare function ${name}(variants?: ${upperName}Variants): string & {
          variants: ${upperName}VariantMap
        }
        `,
      }
    }),
  ]
}
