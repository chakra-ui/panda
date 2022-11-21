import { config } from 'virtual:panda'
import { TokenDictionary } from '@pandacss/token-dictionary'
import { FontTokens } from './font-tokens'

export default function Page() {
  const tokenDictionary = new TokenDictionary(config)
  const tokens = Object.fromEntries(tokenDictionary.categoryMap)

  return <FontTokens fontTokens={tokens.fontWeights} token="fontWeight" />
}
