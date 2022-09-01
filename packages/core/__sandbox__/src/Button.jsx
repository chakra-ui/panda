import { css } from '../__generated__/css'
import { absoluteCenter } from '../__generated__/patterns'

absoluteCenter({ axis: 'x' })

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
