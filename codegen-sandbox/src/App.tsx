import { center } from '../styled-system/patterns'
import { css } from '../styled-system/css'

export default function App() {
  return (
    <div className={center({ w: 'full', h: 'full' })}>
      <div
        className={css({
          display: 'flex',
          flexDir: 'column',
          fontWeight: 'semibold',
          color: 'blue.300',
          textAlign: 'center',
          textStyle: '4xl',
        })}
      >
        <span>🐼</span>
        <span>Hello from Panda</span>
      </div>
    </div>
  )
}
