import { css, globalStyle } from '../styled-system/css'
import { textStyle } from '../styled-system/recipes'
import '../styled-system/styles.css'

globalStyle({
  '*': {
    margin: '0px',
  },
})

function App() {
  return (
    <div>
      <p
        className={css({
          fontSize: '24px',
          fontFamily: 'body',
          marginBottom: '40px',
          color: { _: 'blue', hover: 'red.200' },
        })}
      >
        Welcome
      </p>
      <p className={textStyle({ size: { _: 'h2', md: 'h1' } })}>Hello world</p>
    </div>
  )
}

export default App
