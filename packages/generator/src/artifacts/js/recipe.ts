import type { Context } from '@pandacss/core'
import { Recipes } from '@pandacss/core'
import { unionType, isBoolean } from '@pandacss/shared'
import type { ArtifactFileId } from '@pandacss/types'
import { match } from 'ts-pattern'
import { ArtifactFile } from '../artifact-map'

const stringify = (value: any) => JSON.stringify(value, null, 2)
const isBooleanValue = (value: string) => value === 'true' || value === 'false'
const hasOwn = (obj: any | undefined, key: string): obj is Record<string, any> => {
  if (!obj) return false
  return Object.prototype.hasOwnProperty.call(obj, key)
}

export const recipesCreateRecipeArtifact = new ArtifactFile({
  id: 'recipes/create-recipe.js',
  fileName: 'create-recipe',
  type: 'js',
  dir: (ctx) => ctx.paths.recipe,
  dependencies: ['separator', 'prefix', 'hash', 'theme.breakpoints', 'hooks', 'plugins'],
  imports: {
    'css/css.js': ['css'],
    'css/cx.js': ['cx'],
    'css/conditions.js': ['finalizeConditions', 'sortConditions'],
    'css/cva.js': ['assertCompoundVariant', 'getCompoundVariantCss'],
    'helpers.js': ['compact', 'createCss', 'splitProps', 'uniq', 'withoutSpace'],
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
   `
  },
})

export function getRecipesArtifacts(ctx: Context) {
  if (ctx.recipes.isEmpty()) return []

  return ctx.recipes.details.flatMap((recipe) => {
    const { baseName, config, upperName, variantKeyMap, dashName } = recipe
    const { description, defaultVariants, compoundVariants, deprecated } = config

    const getDefaultValueJsDoc = (key: string) => {
      if (!hasOwn(defaultVariants, key)) return
      let defaultValue = defaultVariants[key]

      if (isBoolean(defaultValue)) {
        defaultValue = defaultValue ? `true` : `false`
      } else {
        defaultValue = JSON.stringify(defaultValue)
      }

      return ctx.file.jsDocComment('', { default: defaultValue })
    }

    return [
      match(config)
        .when(
          Recipes.isSlotRecipeConfig,
          (config) =>
            new ArtifactFile({
              id: ('recipes/' + dashName + '.js') as ArtifactFileId,
              fileName: dashName,
              type: 'js',
              dir: (ctx) => ctx.paths.recipe,
              dependencies: ['theme.slotRecipes.' + baseName],
              imports: {
                'helpers.js': ['compact', 'getSlotCompoundVariant', 'memo', 'splitProps'],
                'recipes/create-recipe.js': ['createRecipe'],
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
              id: ('recipes/' + dashName + '.js') as ArtifactFileId,
              fileName: dashName,
              type: 'js',
              dir: (ctx) => ctx.paths.recipe,
              dependencies: ['theme.recipes.' + baseName],
              imports: {
                'helpers.js': ['memo', 'splitProps'],
                'recipes/create-recipe.js': ['createRecipe', 'mergeRecipes'],
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
        ),
      new ArtifactFile({
        id: ('recipes/' + dashName + '.dts') as ArtifactFileId,
        fileName: dashName,
        type: 'dts',
        dir: (ctx) => ctx.paths.recipe,
        dependencies: ['theme.recipes.' + baseName],
        importsType: {
          'types/index.d.ts': ['ConditionalValue'],
          'types/system-types.d.ts': ['DistributiveOmit', 'Pretty'],
        },
        code() {
          return `
          interface ${upperName}Variant {
            ${Object.keys(variantKeyMap)
              .map((key) => {
                const values = variantKeyMap[key]
                const valueStr = values.every(isBooleanValue) ? `${key}: boolean` : `${key}: ${unionType(values)}`
                return [getDefaultValueJsDoc(key), valueStr].filter(Boolean).join('\n')
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
    ]
  })
}
