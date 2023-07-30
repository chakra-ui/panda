import { isSlotRecipe } from '@pandacss/core'
import { unionType } from '@pandacss/shared'
import { outdent } from 'outdent'
import { match } from 'ts-pattern'
import type { Context } from '../../engines'

const stringify = (value: any) => JSON.stringify(value, null, 2)

const isBooleanValue = (value: string) => value === 'true' || value === 'false'

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
   ${ctx.file.import('css', '../css/css')}
   ${ctx.file.import('assertCompoundVariant, getCompoundVariantCss', '../css/cva')}
   ${ctx.file.import('cx', '../css/cx')}
   ${ctx.file.import('compact, createCss, withoutSpace', '../helpers')}

   export const createRecipe = (name, defaultVariants, compoundVariants) => {
     return (variants) => {
      const transform = (prop, value) => {
        assertCompoundVariant(name, compoundVariants, variants, prop)

         if (value === '__ignore__') {
           return { className: name }
         }

         value = withoutSpace(value)
         return { className: \`\${name}--\${prop}${separator}\${value}\` }
      }

      const recipeCss = createCss({
        hash: ${hash ? 'true' : 'false'},
        utility: {
          prefix: ${prefix ? JSON.stringify(prefix) : undefined},
          transform,
        }
      })

      const recipeStyles = {
        [name]: '__ignore__',
        ...defaultVariants,
        ...compact(variants),
      }

      const compoundVariantStyles = getCompoundVariantCss(compoundVariants, recipeStyles)

      return cx(recipeCss(recipeStyles), css(compoundVariantStyles))
     }
   }
  `,
  }

  return [
    createRecipeFn,
    ...ctx.recipes.details.map((recipe) => {
      const { baseName, config, upperName, variantKeyMap, dashName } = recipe
      const { description, defaultVariants, compoundVariants } = config

      const jsCode = match(config)
        .when(
          isSlotRecipe,
          (config) => outdent`
        ${ctx.file.import('splitProps, getSlotCompoundVariant', '../helpers')}
        ${ctx.file.import('createRecipe', './create-recipe')}

        const defaultVariants = ${stringify(defaultVariants ?? {})}
        const compoundVariants = ${stringify(compoundVariants ?? [])}
        
        const slotNames = ${stringify(config.slots.map((slot) => [slot, `${config.className}__${slot}`]))}
        const slotFns = slotNames.map(([slotName, slotKey]) => [slotName, createRecipe(slotKey, defaultVariants, getSlotCompoundVariant(compoundVariants, slotName))]) 

        const ${baseName}Fn = (props = {}) => {
          return Object.fromEntries(slotFns.map(([slotName, slotFn]) => [slotName, slotFn(props)]))
        }
        
        export const ${baseName} = Object.assign(${baseName}Fn, {
          __recipe__: false,
          raw: (props) => props,
          variantKeys: ${stringify(Object.keys(variantKeyMap))},
          variantMap: ${stringify(variantKeyMap)},
          splitVariantProps(props) {
            return splitProps(props, ${stringify(Object.keys(variantKeyMap))})
          },
        })
        `,
        )
        .otherwise(
          (config) => outdent`
        ${ctx.file.import('splitProps', '../helpers')}
        ${ctx.file.import('createRecipe', './create-recipe')}

        const ${baseName}Fn = createRecipe('${config.className}', ${stringify(defaultVariants ?? {})}, ${stringify(
            compoundVariants ?? [],
          )})

        export const ${baseName} = Object.assign(${baseName}Fn, {
          __recipe__: true,
          raw: (props) => props,
          variantKeys: ${stringify(Object.keys(variantKeyMap))},
          variantMap: ${stringify(variantKeyMap)},
          splitVariantProps(props) {
            return splitProps(props, ${stringify(Object.keys(variantKeyMap))})
          },
        })
        `,
        )

      return {
        name: dashName,

        js: jsCode,

        dts: outdent`
        import type { ConditionalValue } from '../types'
        import type { Pretty } from '../types/helpers'

        type ${upperName}Variant = {
          ${Object.keys(variantKeyMap)
            .map((key) => {
              const values = variantKeyMap[key]
              if (values.every(isBooleanValue)) return `${key}: boolean`
              return `${key}: ${unionType(values)}`
            })
            .join('\n')}
        }

        type ${upperName}VariantMap = {
          [key in keyof ${upperName}Variant]: Array<${upperName}Variant[key]>
        }

        export type ${upperName}VariantProps = {
          [key in keyof ${upperName}Variant]?: ${
          compoundVariants?.length ? `${upperName}Variant[key]` : `ConditionalValue<${upperName}Variant[key]>`
        }
        }

        interface ${upperName}Recipe {
          __type: ${upperName}VariantProps
          (props?: ${upperName}VariantProps): ${
          isSlotRecipe(config) ? `Pretty<Record<${unionType(config.slots)}, string>>` : 'string'
        }
          raw: (props?: ${upperName}VariantProps) => ${upperName}VariantProps
          variantMap: ${upperName}VariantMap
          variantKeys: Array<keyof ${upperName}Variant>
          splitVariantProps<Props extends ${upperName}VariantProps>(props: Props): [${upperName}VariantProps, Pretty<Omit<Props, keyof ${upperName}VariantProps>>]
        }

        ${description ? `/** ${description} */` : ''}
        export declare const ${baseName}: ${upperName}Recipe
        `,
      }
    }),
  ]
}
