import { Badge, Button } from '@sandbox/ds'
import { css } from '../styled-system/css'

export function App() {
  return (
    <main
      className={css({
        color: 'brand',
        padding: '6',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '4',
      })}
    >
      <h1>Hello World</h1>
      <Button>Welcome</Button>
      <Badge>Stable</Badge>
    </main>
  )
}
