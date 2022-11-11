import { config } from 'virtual:panda'
import { TokenDictionary } from '@css-panda/token-dictionary'
import { FontTokens } from './font-tokens'

export default function Page() {
  const tokenDictionary = new TokenDictionary(config)
  const tokens = Object.fromEntries(tokenDictionary.categoryMap)

  return <FontTokens fontTokens={tokens.fontSizes} token="fontSize" />
}
