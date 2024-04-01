import type { Token, TokenExtensions } from '@pandacss/token-dictionary'
import { useState } from 'react'
import * as context from './panda-context'

interface Color {
  isConditional?: boolean
  isReference?: boolean
  name: string
  originalValue: string
  path: string[]
}

type ColorToken = Token & Color & TokenExtensions

const UNCATEGORIZED_ID = 'uncategorized' as const

const groupByColorPalette = (colors: ColorToken[], filterMethod?: (token: ColorToken) => boolean) => {
  const values = colors.filter((color) => !color.isConditional && !color.extensions.isVirtual)

  return values.reduce(
    (acc, color) => {
      if (!filterMethod?.(color)) return acc

      const colorPalette = color.extensions.colorPalette || UNCATEGORIZED_ID

      if (!(colorPalette in acc)) {
        acc[colorPalette] = []
      }

      const exists = (acc[colorPalette] as any[]).find((tok) => tok.name === color.name)
      if (!exists) acc[colorPalette].push(color)

      return acc
    },
    {} as Record<string, ColorToken[]>,
  )
}

const getSemanticTokens = (allTokens: Token[], filterMethod?: (token: ColorToken) => boolean) => {
  const semanticTokens = allTokens.filter(
    (token) => token.type === 'color' && token.isConditional && !token.extensions?.isVirtual,
  ) as ColorToken[]
  return semanticTokens
    .reduce((acc, nxt) => {
      if (!filterMethod) {
        acc.push(nxt)
      } else {
        const rawQualified = semanticTokens.filter(filterMethod)

        if (filterMethod(nxt) || rawQualified.some((tok) => tok.name === nxt.name)) {
          acc.push(nxt)
        }
      }
      return acc
    }, [] as ColorToken[])
    .reduce<Record<string, ColorToken>>(
      (acc, nxt) => ({
        ...acc,
        [nxt.extensions?.prop]: {
          ...acc[nxt.extensions?.prop],
          // @ts-ignore
          [nxt.extensions.condition]: { value: nxt.value, isReference: nxt.isReference },
          extensions: nxt.extensions,
        },
      }),
      {},
    )
}

const allTokens = context.tokens.allTokens
const colors = context.getTokens('colors')

export const useColorDocs = () => {
  const [filterQuery, setFilterQuery] = useState('')

  const filterMethod = (token: ColorToken) => {
    return [
      ...token.path,
      token.originalValue,
      token.description,
      token.value,
      token.name,
      token.extensions?.var,
      token.extensions?.prop,
      ...Object.values(token.extensions?.conditions || {}),
    ]
      .filter(Boolean)
      .some((prop) => prop.includes(filterQuery))
  }

  const colorsInCategories = groupByColorPalette(colors as ColorToken[], filterMethod)
  const uncategorizedColors = colorsInCategories[UNCATEGORIZED_ID]

  const categorizedColors = Object.entries<any[]>(colorsInCategories).filter(
    ([category]) => category !== UNCATEGORIZED_ID,
  )

  const semanticTokens = Object.entries<Record<string, any>>(getSemanticTokens(allTokens, filterMethod)) as [
    string,
    Record<string, ColorToken>,
  ][]
  const hasResults =
    !!categorizedColors.length || !!uncategorizedColors?.length || !!Object.values(semanticTokens).length

  return {
    filterQuery,
    setFilterQuery,
    uncategorizedColors,
    categorizedColors,
    semanticTokens,
    hasResults,
  }
}
