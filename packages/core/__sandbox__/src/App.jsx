import '../__generated__/styles.css'
import { css, fontFace, globalStyle } from '../__generated__/css'
import { textStyle } from '../__generated__/recipes'
import { Alert } from './components/Alert'

fontFace('Roboto Mono', {
  fontDisplay: 'swap',
  fontStyle: 'normal',
  src: ['local("Helvetica Neue Bold")', 'local("HelveticaNeue-Bold")', 'url(MgOpenModernaBold.ttf)'],
})

globalStyle({
  '*, *::before, *::after': {
    borderWidth: '0px',
    borderStyle: 'solid',
  },
})

const tt = textStyle({
  size: 'h1',
})

console.log(tt)

function App() {
  return (
    <div className={css({ background: 'gray.50', padding: '40px' })}>
      <Alert />
    </div>
  )
}

export default App
