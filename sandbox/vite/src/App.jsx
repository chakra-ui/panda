import { css } from '../styled-system/css'
import '../styled-system/styles.css'

function App() {
  return (
    <div>
      <p
        className={css({
          color: 'red.300',
          fontSize: 'lg',
          fontFamily: 'sans-serif',
        })}
      >
        Welcome
      </p>
    </div>
  )
}

export default App
