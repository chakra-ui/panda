import { flatten } from '@pandacss/shared'
import { TokenDictionary } from '@pandacss/token-dictionary'
import type { TokenDataTypes, UserConfig } from '@pandacss/types'

// @ts-ignore
import { config as _config } from 'virtual:panda'

const config = _config as UserConfig

const { theme } = config

const context = {
  tokens: new TokenDictionary(theme ?? {}),
  getCategory(category: keyof TokenDataTypes) {
    return this.tokens.categoryMap.get(category)!
  },
  textStyles: flatten(theme?.textStyles ?? {}),
  layerStyles: flatten(theme?.layerStyles ?? {}),
  logo: config.studio?.logo,
  inject: config.studio?.inject ?? { head: '', body: '' },
}

export default context
