import { css, cx } from '../styled-system/css'
import { textStyle } from '../styled-system/recipes'
import '../styled-system/styles.css'

function App() {
  return (
    <div>
      <p className={css({ fontSize: '24px' })}>Welcome</p>
      <p className={cx(textStyle({ size: 'h1' }), css({ background: 'red.200' }))}>Hello world</p>
    </div>
  )
}

export default App
