import { css } from '../../styled-system/css'
import { Button, Thingy } from './Button'

export default function Home() {
  return (
    <>
      <Button className={css({ display: 'block', _hover: { color: 'red' } })}>Client component button</Button>
      <Thingy className={css({ display: 'block', _hover: { color: 'yellow' } })}>
        Client component button with recipe
      </Thingy>
    </>
  )
}
