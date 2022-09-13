import { css, globalStyle } from '../styled-system/css'
import { textStyle } from '../styled-system/recipes'
import { stack } from '../styled-system/patterns'
import { panda } from '../styled-system/jsx'
import '../styled-system/styles.css'

globalStyle({
  '*': {
    margin: '0',
  },
})

function App() {
  return (
    <div className={stack({ gap: '10px', align: 'center' })}>
      <p
        className={css({
          color: 'red.300',
          fontSize: 'lg',
          fontFamily: 'sans-serif',
          hover: {
            color: 'red.300',
            background: { _: 'purple', md: 'red' },
          },
        })}
      >
        Welcome
      </p>
      <h1 className={textStyle({ size: 'h2' })}>Beesama</h1>
      <panda.div
        fontFamily="body"
        marginTop="20px"
        paddingX="4"
        paddingY="6"
        backgroundColor="red.200"
        hover={{
          backgroundColor: 'blue',
          color: 'red.300',
        }}
      >
        Welcome home
      </panda.div>
      <panda.button
        css={{
          color: 'red',
          border: '0',
          active: { color: 'darkred' },
        }}
      >
        Click me
      </panda.button>
    </div>
  )
}

export default App
