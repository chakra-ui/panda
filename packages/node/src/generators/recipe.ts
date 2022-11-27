import { capitalize, unionType } from '@pandacss/shared'
import { outdent } from 'outdent'
import type { PandaContext } from '../context'

export function generateRecipes(ctx: PandaContext) {
  const { recipes = {}, hash, hasRecipes, utility } = ctx
  const { separator } = utility

  if (!hasRecipes) return

  const js = [
    outdent`
   import { createCss, withoutSpace } from "../helpers"

   const createRecipe = (name, defaultVariants) => {
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
          transform,
        }
      }
      
      const css = createCss(context)
      
      return css({
        [name]: '__ignore__',
        ...defaultVariants,
        ...variants
      })
     }
   }
  `,
  ]

  const dts = ['']

  Object.values(recipes).forEach((recipe) => {
    const { name, description, defaultVariants, variants } = recipe

    js.push(outdent`
    export const ${name} = createRecipe('${name}', ${JSON.stringify(defaultVariants ?? {})})
    `)

    dts.push(outdent`
    import { ConditionalValue } from "../types"

    export type ${capitalize(name)}Value = {
      ${Object.keys(variants ?? {})
        .map((key) => {
          const value = variants![key]
          const keys = Object.keys(value)
          return `${key}?: ConditionalValue<${unionType(keys)}>`
        })
        .join('\n')}
    }

    ${description ? `/** ${description} */` : ''}
    export declare function ${name}(value: ${capitalize(name)}Value): string
    `)
  })

  return {
    js: outdent.string(js.join('\n\n')),
    dts: outdent.string(dts.join('\n\n')),
  }
}
