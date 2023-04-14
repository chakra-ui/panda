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

  // TODO add link to docs in the error ?
  const createRecipeFn = {
    name: 'create-recipe',
    dts: '',
    js: outdent`
   ${ctx.file.import('css, mergeCss', '../css/css')}
   ${ctx.file.import('cx', '../css/cx')}
   ${ctx.file.import('createCss, withoutSpace, compact', '../helpers')}

   export const createRecipe = (name, defaultVariants, compoundVariants) => {
     return (variants) => {
      const transform = (prop, value) => {
        if (compoundVariants.length > 0 && typeof variants[prop] === 'object') {
          throw new Error(
            \`[recipe:\${name}:\${prop}:\${value}] Conditions are not supported when using compound variants.\`,
          )
        }

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

      const recipeCss = createCss(context)
      const recipeStyles = {
        [name]: '__ignore__',
        ...defaultVariants,
        ...compact(variants),
      }

      let result = {}
      compoundVariants.forEach((compoundVariant) => {
        const isMatching = Object.entries(compoundVariant).every(([key, value]) => {
          if (key === 'css') return true

          const values = Array.isArray(value) ? value : [value]
          return values.some((value) => recipeStyles[key] === value)
        })

        if (isMatching) {
          result = mergeCss(result, compoundVariant.css)
        }
      })

      return cx(recipeCss(recipeStyles), css(result))
     }
   }
  `,
  }

  return [
    createRecipeFn,
    ...ctx.recipes.details.map((recipe) => {
      const { config, upperName, variantKeyMap, dashName } = recipe
      const { name, description, defaultVariants, compoundVariants } = config

      return {
        name: dashName,

        js: outdent`
        ${ctx.file.import('createRecipe', './create-recipe')}

        export const ${name} = createRecipe('${name}', ${JSON.stringify(defaultVariants ?? {})}, ${JSON.stringify(
          compoundVariants ?? [],
        )})
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
          [key in keyof ${upperName}Variant]?: ${
          compoundVariants?.length ? `${upperName}Variant[key]` : `ConditionalValue<${upperName}Variant[key]>`
        }
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
