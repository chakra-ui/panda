import { capitalize, dashCase, splitProps, uncapitalize } from '@pandacss/shared'
import type { AnyRecipeConfig, UserConfig } from '@pandacss/types'
import { Obj, pipe } from 'lil-fp'

const mergeRegex = (item: Array<string | RegExp>) => {
  const regex = item.map((item) => (typeof item === 'string' ? item : item.source)).join('|')
  return new RegExp(`^${regex}$`)
}

export const getRecipeEngine = (config: UserConfig) => {
  return pipe(
    { recipes: config.theme?.recipes ?? {} },

    Obj.bind('getConfig', ({ recipes }) => {
      return (name: string): AnyRecipeConfig | undefined => recipes[name]
    }),

    Obj.bind('getNames', () => {
      return (name: string) => ({
        upperName: capitalize(name),
        dashName: dashCase(name),
        jsxName: capitalize(name),
      })
    }),

    Obj.bind('nodes', ({ recipes }) => {
      return Object.entries(recipes).map(([name, recipe]) => {
        const jsx = recipe.jsx ?? [capitalize(name)]
        const match = mergeRegex(jsx)
        return {
          type: 'recipe' as const,
          name: capitalize(name),
          props: Object.keys(recipe.variants ?? {}),
          baseName: name,
          jsx,
          match,
        }
      })
    }),

    Obj.bind('getFnName', ({ nodes }) => {
      return (jsx: string) => {
        const recipe = nodes.find((node) => node.match.test(jsx))
        return recipe?.baseName ?? uncapitalize(jsx)
      }
    }),

    Obj.bind('splitProps', ({ nodes }) => {
      return (name: string, props: Record<string, any>) => {
        const recipe = nodes.find((node) => node.match.test(name))
        if (!recipe) return [{}, props]
        return splitProps(props, recipe.props)
      }
    }),

    Obj.bind('details', ({ getNames, recipes }) => {
      return Object.entries(recipes).map(([name, recipe]) => ({
        ...getNames(name),
        config: recipe,
        variantKeyMap: Object.fromEntries(
          Object.entries(recipe.variants ?? {}).map(([key, value]) => [key, Object.keys(value as any)]),
        ),
      }))
    }),

    Obj.bind('isEmpty', ({ recipes }) => {
      return () => Object.keys(recipes).length === 0
    }),
  )
}
