import { css, cx } from '../__generated__/css'
import { textStyle } from '../__generated__/recipes'
import '../__generated__/styles.css'
import { Alert } from './components/Alert'

function App() {
  return (
    <div>
      <Alert />
      <p className={textStyle({ size: 'h2' })}>Welcome</p>
      <p className={cx(textStyle({ size: 'h1' }), css({ background: 'red.200' }))}>Hello world</p>
    </div>
  )
}

export default App
