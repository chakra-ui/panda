import { config } from 'virtual:panda'
import { TokenDictionary } from '@pandacss/token-dictionary'

function Index() {
  const tokenDictionary = new TokenDictionary(config)
  const tokens = Object.fromEntries(tokenDictionary.categoryMap)

  return <div>Home</div>
}

export default Index
