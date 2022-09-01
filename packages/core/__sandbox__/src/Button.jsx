import { css } from '../__generated__/css'
import { stack } from '../__generated__/patterns'

stack({ gap: { _: '4', md: '6' } })

export function Button({ children }) {
  return (
    <button
      className={css({
        fontSize: '15px',
        background: 'red',
        border: '1px solid marron',
      })}
    >
      {children}
    </button>
  )
}
