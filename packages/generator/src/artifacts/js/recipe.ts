import type { Context } from '@pandacss/core'
import { Recipes } from '@pandacss/core'
import { unionType } from '@pandacss/shared'
import type { ArtifactFilters } from '@pandacss/types'
import { match } from 'ts-pattern'
import { ArtifactFile } from '../artifact'

const stringify = (value: any) => JSON.stringify(value, null, 2)
const isBooleanValue = (value: string) => value === 'true' || value === 'false'

export const createRecipeArtifact = new ArtifactFile({
  id: 'recipes/create-recipe',
  fileName: 'create-recipe',
  type: 'js',
  dir: (ctx) => ctx.paths.recipe,
  dependencies: ['separator', 'prefix', 'hash', 'theme.breakpoints'],
  imports: {
    'css/css': ['conditions', 'css', 'cva', 'cx'],
    'css/conditions': ['finalizeConditions', 'sortConditions'],
    'css/cva': ['assertCompoundVariant', 'getCompoundVariantCss'],
    'css/cx': ['cx'],
    helpers: ['compact', 'createCss', 'splitProps', 'uniq', 'withoutSpace'],
  },
  computed: (ctx) => {
    return {
      hasRecipes: !ctx.recipes.isEmpty(),
      breakpoints: ctx.conditions.breakpoints.keys,
      toHash: ctx.utility.toHash,
    }
  },
  code(params) {
    if (!params.computed.hasRecipes) return

    return `
    export const createRecipe = (name, defaultVariants, compoundVariants) => {
     const getVariantProps = (variants) => {
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
          return { className: \`\${name}--\${prop}${params.dependencies.separator}\${value}\` }
       }

       const recipeCss = createCss({
         ${params.dependencies.hash.className ? 'hash: true,' : ''}
         conditions: {
           shift: sortConditions,
           finalize: finalizeConditions,
           breakpoints: { keys: ${JSON.stringify(params.computed.breakpoints)} }
         },
         utility: {
           ${params.dependencies.prefix.className ? 'prefix: ' + JSON.stringify(params.dependencies.prefix.className) + ',' : ''}
           toHash: ${params.computed.toHash},
           transform,
         }
       })

       const recipeStyles = getVariantProps(variants)

       if (withCompoundVariants) {
         const compoundVariantStyles = getCompoundVariantCss(compoundVariants, recipeStyles)
         return cx(recipeCss(recipeStyles), css(compoundVariantStyles))
       }

       return recipeCss(recipeStyles)
      }

       return {
         recipeFn,
         getVariantProps,
         __getCompoundVariantCss__: (variants) => {
           return getCompoundVariantCss(compoundVariants, getVariantProps(variants));
         },
       }
    }

    export const mergeRecipes = (recipeA, recipeB) => {
     if (recipeA && !recipeB) return recipeA
     if (!recipeA && recipeB) return recipeB

     const recipeFn = (...args) => cx(recipeA(...args), recipeB(...args))
     const variantKeys = uniq(recipeA.variantKeys, recipeB.variantKeys)
     const variantMap = variantKeys.reduce((acc, key) => {
       acc[key] = uniq(recipeA.variantMap[key], recipeB.variantMap[key])
       return acc
     }, {})

     return Object.assign(recipeFn, {
       __recipe__: true,
       __name__: \`$\{recipeA.__name__} \${recipeB.__name__}\`,
       raw: (props) => props,
       variantKeys,
       variantMap,
       splitVariantProps(props) {
         return splitProps(props, variantKeys)
       },
     })
     }
   }
   `
  },
})

export function generateRecipes(ctx: Context, filters?: ArtifactFilters) {
  const { recipes } = ctx

  if (recipes.isEmpty()) return

  const details = ctx.recipes.filterDetails(filters)

  return details.map((recipe) => {
    const { baseName, config, upperName, variantKeyMap, dashName } = recipe
    const { description, defaultVariants, compoundVariants, deprecated } = config

    const jsCode = match(config)
      .when(
        Recipes.isSlotRecipeConfig,
        (config) =>
          new ArtifactFile({
            id: 'recipes/' + dashName,
            fileName: dashName,
            type: 'js',
            dir: (ctx) => ctx.paths.recipe,
            dependencies: [],
            imports: {
              helpers: ['compact', 'getSlotCompoundVariant', 'memo', 'splitProps'],
              'create-recipe': ['createRecipe'],
            },
            code() {
              return `
            const ${baseName}DefaultVariants = ${stringify(defaultVariants ?? {})}
            const ${baseName}CompoundVariants = ${stringify(compoundVariants ?? [])}

            const ${baseName}SlotNames = ${stringify(config.slots.map((slot) => [slot, `${config.className}__${slot}`]))}
            const ${baseName}SlotFns = /* @__PURE__ */ ${baseName}SlotNames.map(([slotName, slotKey]) => [slotName, createRecipe(slotKey, ${baseName}DefaultVariants, getSlotCompoundVariant(${baseName}CompoundVariants, slotName))])

            const ${baseName}Fn = memo((props = {}) => {
              return Object.fromEntries(${baseName}SlotFns.map(([slotName, slotFn]) => [slotName, slotFn.recipeFn(props)]))
            })

            const ${baseName}VariantKeys = ${stringify(Object.keys(variantKeyMap))}
            const getVariantProps = (variants) => ({ ...${baseName}DefaultVariants, ...compact(variants) })

            export const ${baseName} = /* @__PURE__ */ Object.assign(${baseName}Fn, {
              __recipe__: false,
              __name__: '${baseName}',
              raw: (props) => props,
              variantKeys: ${baseName}VariantKeys,
              variantMap: ${stringify(variantKeyMap)},
              splitVariantProps(props) {
                return splitProps(props, ${baseName}VariantKeys)
              },
              getVariantProps
            })
            `
            },
          }),
      )
      .otherwise(
        (config) =>
          new ArtifactFile({
            id: 'recipes/' + dashName,
            fileName: dashName,
            type: 'js',
            dir: (ctx) => ctx.paths.recipe,
            dependencies: [],
            imports: {
              helpers: ['memo', 'splitProps'],
              'create-recipe': ['createRecipe', 'mergeRecipes'],
            },
            code() {
              return `
            const ${baseName}Fn = /* @__PURE__ */ createRecipe('${config.className}', ${stringify(
              defaultVariants ?? {},
            )}, ${stringify(compoundVariants ?? [])})

            const ${baseName}VariantMap = ${stringify(variantKeyMap)}

            const ${baseName}VariantKeys = Object.keys(${baseName}VariantMap)

            export const ${baseName} = /* @__PURE__ */ Object.assign(memo(${baseName}Fn.recipeFn), {
              __recipe__: true,
              __name__: '${baseName}',
              __getCompoundVariantCss__: ${baseName}Fn.__getCompoundVariantCss__,
              raw: (props) => props,
              variantKeys: ${baseName}VariantKeys,
              variantMap: ${baseName}VariantMap,
              merge(recipe) {
                return mergeRecipes(this, recipe)
              },
              splitVariantProps(props) {
                return splitProps(props, ${baseName}VariantKeys)
              },
              getVariantProps: ${baseName}Fn.getVariantProps,
            })
            `
            },
          }),
      )

    return {
      name: dashName,
      js: jsCode,
      dts: new ArtifactFile({
        id: 'recipes/' + dashName,
        fileName: dashName,
        type: 'dts',
        dir: (ctx) => ctx.paths.recipe,
        dependencies: [],
        importsType: {
          'types/index': ['ConditionalValue', 'DistributiveOmit', 'Pretty'],
        },
        code() {
          return `
          ${ctx.file.importType('ConditionalValue', '../types/index')}
          ${ctx.file.importType('DistributiveOmit, Pretty', '../types/system-types')}

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
            } | undefined
          }

          export interface ${upperName}Recipe {
            __type: ${upperName}VariantProps
            (props?: ${upperName}VariantProps): ${
              Recipes.isSlotRecipeConfig(config) ? `Pretty<Record<${unionType(config.slots)}, string>>` : 'string'
            }
            raw: (props?: ${upperName}VariantProps) => ${upperName}VariantProps
            variantMap: ${upperName}VariantMap
            variantKeys: Array<keyof ${upperName}Variant>
            splitVariantProps<Props extends ${upperName}VariantProps>(props: Props): [${upperName}VariantProps, Pretty<DistributiveOmit<Props, keyof ${upperName}VariantProps>>]
            getVariantProps: (props?: ${upperName}VariantProps) => ${upperName}VariantProps
          }

          ${ctx.file.jsDocComment(description, { deprecated })}
          export declare const ${baseName}: ${upperName}Recipe
          `
        },
      }),
    }
  })
}
