import { flatten } from '@pandacss/shared'
import { TokenDictionary } from '@pandacss/token-dictionary'
import type { TokenDataTypes } from '@pandacss/types'
import { config } from 'virtual:panda'

const { theme } = config

const context = {
  tokens: new TokenDictionary(theme ?? {}),
  getCategory(category: keyof TokenDataTypes) {
    return this.tokens.categoryMap.get(category) ?? new Map()
  },
  textStyles: flatten(theme?.textStyles ?? {}),
  layerStyles: flatten(theme?.layerStyles ?? {}),
  logo: config.studio?.logo,
  inject: config.studio?.inject ?? { head: '', body: '' },
}

export default context
