import type { Token } from '@pandacss/types'
import { config } from 'virtual:panda'
import { TokenDictionary } from '@pandacss/token-dictionary'
import { useState } from 'react'

type Color = {
  isConditional?: boolean
  isReference?: boolean
  name: string
  originalValue: string
  path: string[]
}

type ColorToken = Token & Color

const UNCATEGORIZED_ID = 'uncategorized' as const

const groupByColorPalette = (colors: Map<string, any>, filterMethod?: (token: ColorToken) => boolean) => {
  const values = Array.from(colors.values()).filter((color) => !color.isConditional && !color.extensions.isVirtual)
  return values.reduce((acc, nxt) => {
    if (!filterMethod?.(nxt)) return acc

    const colorPalette = nxt.extensions.colorPalette || UNCATEGORIZED_ID
    if (!(colorPalette in acc)) acc[colorPalette] = []
    const exists = (acc[colorPalette] as any[]).find((tok) => tok.name === nxt.name)
    if (!exists) acc[colorPalette].push(nxt)
    return acc
  }, {})
}

const getSemanticTokens = (allTokens: ColorToken[], filterMethod?: (token: ColorToken) => boolean) => {
  const semanticTokens = allTokens.filter(
    (token) => token.type === 'color' && token.isConditional && !token.extensions?.isVirtual,
  )
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
    .reduce(
      (acc, nxt) => ({
        ...acc,
        [nxt.extensions?.prop]: {
          //@ts-expect-error
          ...acc[nxt.extensions?.prop],
          [nxt.extensions?.condition]: { value: nxt.value, isReference: nxt.isReference },
          extensions: nxt.extensions,
        },
      }),
      {},
    )
}

export const useColorDocs = () => {
  const tokenDictionary = new TokenDictionary(config.theme!)
  const tokens = Object.fromEntries(tokenDictionary.categoryMap)
  const allTokens = tokenDictionary.allTokens

  const { colors } = tokens

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

  const colorsInCategories = groupByColorPalette(colors, filterMethod)
  const uncategorizedColors = colorsInCategories[UNCATEGORIZED_ID]

  const categorizedColors = Object.entries<any[]>(colorsInCategories).filter(
    ([category]) => category !== UNCATEGORIZED_ID,
  )

  const semanticTokens = Object.entries<Record<string, any>>(getSemanticTokens(allTokens, filterMethod))
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
