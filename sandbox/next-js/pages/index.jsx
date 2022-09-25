import { css } from '../styled-system/css'
import { Button } from './button'
import { Card } from './card'

export default function Home() {
  return (
    <div>
      <div
        className={css({
          padding: '24px',
          fontFamily: 'body',
          fontSize: '24px',
          color: 'green',
        })}
      >
        Welcome
      </div>
      <Button>Click me</Button>
      <Card>Card is here</Card>
    </div>
  )
}
