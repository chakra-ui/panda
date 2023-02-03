import { capitalize, dashCase, splitProps } from '@pandacss/shared'
import type { LoadConfigResult } from '@pandacss/types'
import { Obj, pipe } from 'lil-fp'

export const recipe = ({ config }: LoadConfigResult) => {
  return pipe(
    { recipes: config.theme?.recipes ?? {} },

    Obj.bind('getConfig', ({ recipes }) => {
      return (name: string) => recipes[name]
    }),

    Obj.bind('getNames', ({ getConfig }) => {
      return (name: string) => ({
        upperName: capitalize(name),
        dashName: dashCase(name),
        jsxName: getConfig(name)?.jsx ?? capitalize(name),
      })
    }),

    Obj.bind('nodes', ({ recipes }) => {
      return Object.entries(recipes).map(([name, recipe]) => ({
        type: 'recipe' as const,
        name: recipe.jsx ?? capitalize(name),
        props: Object.keys(recipe.variants ?? {}),
        baseName: name,
      }))
    }),

    Obj.bind('exec', ({ nodes }) => {
      return (name: string, props: Record<string, any>) => {
        const recipe = nodes.find((node) => node.name === name)
        if (!recipe) return [{}, props]
        return splitProps(props, recipe.props)
      }
    }),

    Obj.bind('details', ({ recipes }) => {
      return Object.entries(recipes).map(([name, recipe]) => ({
        [name]: Object.entries(recipe.variants ?? {}).map(([key, value]) => ({
          [key]: Object.keys(value),
        })),
      }))
    }),

    Obj.bind('isEmpty', ({ recipes }) => Object.keys(recipes).length > 0),
  )
}
