import './App.css'
import { config } from 'virtual:panda'
import { TokenDictionary } from '@css-panda/token-dictionary'

function App() {
  const tokenDictionary = new TokenDictionary(config)
  const tokens = Object.fromEntries(tokenDictionary.categoryMap)

  return (
    <div className="App">
      {/*  */}
      <div className="token-group">
        <div className="token-content">
          <div className="color-wrapper">
            <div className="shades">{renderColors(tokens.colors)}</div>
          </div>
        </div>
      </div>
      {/*  */}
    </div>
  )
}

export default App

type ColorsProps = {
  colors: Map<string, any>
}

const renderColors = (colors: ColorsProps['colors']) => {
  const values = Array.from(colors.values())
  return values?.map((color, i) => {
    return (
      <div className="shade" key={i}>
        <div className="color-box" style={{ background: color.value }} />
        <div className="shade-value">{color.key}</div>
      </div>
    )
  })
}
