import { css } from '../design-system/css'
import { TsPlayground } from './TsPlayground'

function App() {
  return (
    <div className={css({ padding: '2rem' })}>
      <TsPlayground />
    </div>
  )
}

export default App
