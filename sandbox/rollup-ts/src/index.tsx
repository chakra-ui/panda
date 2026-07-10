import { css, cx } from '../styled-system/css'
import { hstack } from '../styled-system/patterns'
import { styled } from '../styled-system/jsx'
import { button } from '../styled-system/recipes'
import { token } from '../styled-system/tokens'

// css() call -> static atomic class string
const card = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  padding: '6',
  borderRadius: 'lg',
  backgroundColor: 'red.50',
  color: 'red.700',
})

// token() -> resolved value inlined at build time
const accent = token('colors.blue.500')

// styled factory member -> intrinsic element with class names
const Panel = styled.section

export function App() {
  return (
    <Panel className={cx(card, hstack({ gap: '3' }))} style={{ borderColor: accent }}>
      <button className={button({ size: 'sm' })}>Small</button>
      <button className={button({ size: 'md' })}>Medium</button>
    </Panel>
  )
}
