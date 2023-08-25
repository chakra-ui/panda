import { css } from '../../styled-system/css'
import { Button, Thingy } from './Button'

export default function Home() {
  return (
    <>
      <div className={css({ fontSize: '2xl', fontWeight: 'bold' })}>Hello 🐼!</div>
      <Button css={{ display: 'block', _hover: { color: 'red' } }}>Client component button</Button>
      <Thingy css={{ display: 'block', _hover: { color: 'yellow' } }}>Client component button with recipe</Thingy>
    </>
  )
}
