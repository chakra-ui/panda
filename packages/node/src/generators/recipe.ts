import { capitalize, unionType } from '@pandacss/shared'
import { outdent } from 'outdent'
import type { PandaContext } from '../context'

export function generateRecipes(ctx: PandaContext) {
  const { recipes = {}, hash, hasRecipes, utility } = ctx
  const { separator } = utility

  if (!hasRecipes) return

  const js = [
    outdent`
   ${ctx.getImport('createCss, withoutSpace, compact', '../helpers')}

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
          prefix: ${ctx.prefix ? JSON.stringify(ctx.prefix) : undefined},
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
  ]

  const dts = [
    outdent`
  import type { ConditionalValue } from '../types'
  `,
  ]

  Object.values(recipes).forEach((recipe) => {
    const { name, description, defaultVariants, variants } = recipe

    js.push(outdent`
    export const ${name} = createRecipe('${name}', ${JSON.stringify(defaultVariants ?? {})})
    ${name}.variants = ${JSON.stringify(Object.keys(variants ?? {}))}
    `)

    dts.push(outdent`
    export type ${capitalize(name)}Variants = {
      ${Object.keys(variants ?? {})
        .map((key) => {
          const value = variants![key]
          const keys = Object.keys(value)
          return `${key}?: ConditionalValue<${unionType(keys)}>`
        })
        .join('\n')}
    }

    ${description ? `/** ${description} */` : ''}
    export declare function ${name}(variants?: ${capitalize(name)}Variants): string & { variants: string[] }
    `)
  })

  return {
    js: outdent.string(js.join('\n\n')),
    dts: outdent.string(dts.join('\n\n')),
  }
}
