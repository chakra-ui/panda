import { capitalize, dashCase, splitProps, uncapitalize } from '@pandacss/shared'
import type { RecipeConfig, UserConfig } from '@pandacss/types'
import { Obj, pipe } from 'lil-fp'

export const getRecipeEngine = (config: UserConfig) => {
  return pipe(
    { recipes: config.theme?.recipes ?? {} },

    Obj.bind('getConfig', ({ recipes }) => {
      return (name: string): RecipeConfig | undefined => recipes[name]
    }),

    Obj.bind('getNames', () => {
      return (name: string) => ({
        upperName: capitalize(name),
        dashName: dashCase(name),
        jsxName: capitalize(name),
      })
    }),

    Obj.bind('nodes', ({ recipes }) => {
      return Object.entries(recipes).map(([name, recipe]) => ({
        type: 'recipe' as const,
        name: capitalize(name),
        props: Object.keys(recipe.variants ?? {}),
        baseName: name,
        jsx: recipe.jsx ?? [capitalize(name)],
      }))
    }),

    Obj.bind('getFnName', ({ nodes }) => {
      return (jsx: string) => {
        const recipe = nodes.find((node) => {
          return node.jsx.some((tag) => (typeof tag === 'string' ? tag === jsx : tag.test(jsx)))
        })

        return recipe?.baseName ?? uncapitalize(jsx)
      }
    }),

    Obj.bind('splitProps', ({ nodes }) => {
      return (name: string, props: Record<string, any>) => {
        const recipe = nodes.find((node) => {
          return node.jsx.some((tag) => (typeof tag === 'string' ? tag === name : tag.test(name)))
        })
        if (!recipe) return [{}, props]
        return splitProps(props, recipe.props)
      }
    }),

    Obj.bind('details', ({ getNames, recipes }) => {
      return Object.entries(recipes).map(([name, recipe]) => ({
        ...getNames(name),
        config: recipe,
        variantKeyMap: Object.fromEntries(
          Object.entries(recipe.variants ?? {}).map(([key, value]) => [key, Object.keys(value)]),
        ),
      }))
    }),

    Obj.bind('isEmpty', ({ recipes }) => {
      return () => Object.keys(recipes).length === 0
    }),
  )
}
