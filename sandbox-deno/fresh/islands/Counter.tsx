import { useState } from 'preact/hooks'
import { css } from '../styled-system/css/css.ts'

const button = css({
  padding: '6px 12px',
  borderRadius: '999px',
  backgroundColor: 'brand.700',
  color: 'white',
  fontWeight: '700',
})

export default function Counter() {
  const [count, setCount] = useState(0)

  return (
    <button type="button" class={button} onClick={() => setCount((value) => value + 1)}>
      Island clicks: {count}
    </button>
  )
}
