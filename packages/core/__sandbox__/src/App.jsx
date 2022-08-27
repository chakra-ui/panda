import '../__generated__/styles.css'
import { css, fontFace } from '../__generated__/css'
import { Button } from './Button'

fontFace('Roboto Mono', {
  fontDisplay: 'swap',
  fontStyle: 'normal',
  src: ['local("Helvetica Neue Bold")', 'local("HelveticaNeue-Bold")', 'url(MgOpenModernaBold.ttf)'],
})

function App() {
  return (
    <div>
      <div
        className={css({
          background: { _: 'red.100', md: 'red' },
          padding: '20px',
        })}
      >
        <p
          className={css({
            fontSize: { _: '24px', md: '50px' },
            fontFamily: 'sans-serif',
            color: { _: 'white', dark: 'red.300' },
            padding: '20px',
            marginTop: '40px',
            marginBottom: { _: '-0.5', md: '50px' },
          })}
        >
          Panda is working!
        </p>
      </div>
      <Button>Click me</Button>
    </div>
  )
}

export default App
