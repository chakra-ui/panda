import '../__generated__/styles.css'
import { css } from '../__generated__/css'
import { Button } from './Button'

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
            color: 'white',
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
