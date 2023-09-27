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
    const getRecipeStyles = (variants) => {
      return {
        [name]: '__ignore__',
        ...defaultVariants,
        ...compact(variants),
      };
    };

     const recipeFn = (variants, withCompoundVariants = true) => {
      const transform = (prop, value) => {
        assertCompoundVariant(name, compoundVariants, variants, prop)

         if (value === '__ignore__') {
           return { className: name }
         }

         value = withoutSpace(value)
         return { className: \`\${name}--\${prop}${separator}\${value}\` }
      }

      const recipeCss = createCss({
        ${hash ? 'hash: true,' : ''}
        utility: {
          ${prefix ? 'prefix: ' + JSON.stringify(prefix) + ',' : ''}
          transform,
        }
      })

      const recipeStyles = getRecipeStyles(variants)

      if (withCompoundVariants) {
        const compoundVariantStyles = getCompoundVariantCss(compoundVariants, recipeStyles)
        return cx(recipeCss(recipeStyles), css(compoundVariantStyles))
      }

      return recipeCss(recipeStyles)
     }

      return Object.assign(recipeFn, {
        __getCompoundVariantCss__: (variants) => {
          return getCompoundVariantCss(compoundVariants, getRecipeStyles(variants));
        },
      })
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

        const ${baseName}DefaultVariants = ${stringify(defaultVariants ?? {})}
        const ${baseName}CompoundVariants = ${stringify(compoundVariants ?? [])}

        const ${baseName}SlotNames = ${stringify(config.slots.map((slot) => [slot, `${config.className}__${slot}`]))}
        const ${baseName}SlotFns = ${baseName}SlotNames.map(([slotName, slotKey]) => [slotName, createRecipe(slotKey, ${baseName}DefaultVariants, getSlotCompoundVariant(${baseName}CompoundVariants, slotName))])

        const ${baseName}Fn = (props = {}) => {
          return Object.fromEntries(${baseName}SlotFns.map(([slotName, slotFn]) => [slotName, slotFn(props)]))
        }

        const ${baseName}VariantKeys = ${stringify(Object.keys(variantKeyMap))}

        export const ${baseName} = Object.assign(${baseName}Fn, {
          __recipe__: false,
          raw: (props) => props,
          variantKeys: ${baseName}VariantKeys,
          variantMap: ${stringify(variantKeyMap)},
          splitVariantProps(props) {
            return splitProps(props, ${baseName}VariantKeys)
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

        const ${baseName}VariantMap = ${stringify(variantKeyMap)}
        const ${baseName}VariantKeys = Object.keys(${baseName}VariantMap)
        export const ${baseName} = Object.assign(${baseName}Fn, {
          __recipe__: true,
          raw: (props) => props,
          variantKeys: ${baseName}VariantKeys,
          variantMap: ${baseName}VariantMap,
          splitVariantProps(props) {
            return splitProps(props, ${baseName}VariantKeys)
          },
        })
        `,
        )

      return {
        name: dashName,

        js: jsCode,

        dts: outdent`
        ${ctx.file.importType('ConditionalValue', '../types/index')}
        ${ctx.file.importType('Pretty', '../types/helpers')}
        ${ctx.file.importType('DistributiveOmit', '../types/system-types')}

        interface ${upperName}Variant {
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

        export interface ${upperName}Recipe {
          __type: ${upperName}VariantProps
          (props?: ${upperName}VariantProps): ${
          isSlotRecipe(config) ? `Pretty<Record<${unionType(config.slots)}, string>>` : 'string'
        }
          raw: (props?: ${upperName}VariantProps) => ${upperName}VariantProps
          variantMap: ${upperName}VariantMap
          variantKeys: Array<keyof ${upperName}Variant>
          splitVariantProps<Props extends ${upperName}VariantProps>(props: Props): [${upperName}VariantProps, Pretty<DistributiveOmit<Props, keyof ${upperName}VariantProps>>]
        }

        ${description ? `/** ${description} */` : ''}
        export declare const ${baseName}: ${upperName}Recipe
        `,
      }
    }),
  ]
}
