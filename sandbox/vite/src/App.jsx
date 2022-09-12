import { css, globalStyle } from '../styled-system/css'
import { textStyle } from '../styled-system/recipes'
import { stack } from '../styled-system/patterns'
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
    </div>
  )
}

export default App
