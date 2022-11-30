import { config } from 'virtual:panda'
import { TokenDictionary } from '@pandacss/token-dictionary'
import { FontTokens } from './font-tokens'

export default function Page() {
  const tokenDictionary = new TokenDictionary(config)
  const tokens = Object.fromEntries(tokenDictionary.categoryMap)

  return (
    <FontTokens
      fontTokens={tokens.lineHeights}
      token="lineHeight"
      largeText
      text="So I started to walk into the water. I won't lie to you boys, I was terrified. But I pressed on, and as I made my way past the breakers a strange calm came over me. I don't know if it was divine intervention or the kinship of all living things but I tell you Jerry at that moment, I was a marine biologist."
      css={{
        '& .render': {
          fontSize: 'unset',
        },
      }}
    />
  )
}
