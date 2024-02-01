import { flatten } from '@pandacss/shared'
import { Token, TokenDictionary } from '@pandacss/token-dictionary'
import type { TokenDataTypes } from '@pandacss/types'
import { config } from 'virtual:panda'

export const theme = config.theme ?? {}

export const tokens = new TokenDictionary(theme).init()

export const getTokens = (category: keyof TokenDataTypes): Token[] => {
  const map = tokens.view.categoryMap.get(category) ?? new Map()
  return Array.from(map.values())
}

type Colors = Array<{
  label: string
  value: string
}>

export const colors: Colors = getTokens('colors')
  .filter((color) => !color.isConditional && !color.extensions.isVirtual)
  .map((color) => ({
    label: color.extensions.prop,
    value: color.value,
  }))

export const textStyles = flatten(theme?.textStyles ?? {})

export const layerStyles = flatten(theme?.layerStyles ?? {})

export const logo = config.studio?.logo

export const inject = config.studio?.inject ?? { head: '', body: '' }
