import { TokenDictionary } from '@pandacss/token-dictionary'
import preset from '@pandacss/preset-panda'

const dictionary = new TokenDictionary({
  tokens: preset.theme.tokens
})

const Colors = () => {
  return (
    <div>
      <>Hello</>
      {dictionary.filter({ type: 'color' }).map((token, index) => {
        return <div key={index}>{token.name}</div>
      })}
    </div>
  )
}

type Props = {
  type: string
}

export const TokenDocs = (props: Props) => {
  const { type } = props
  return <p>Welcome</p>
}
