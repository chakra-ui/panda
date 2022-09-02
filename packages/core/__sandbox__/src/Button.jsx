import { css } from '../__generated__/css'
import { absoluteCenter } from '../__generated__/patterns'

export function Button({ children }) {
  return (
    <div className={css({ position: 'relative' })}>
      <div className={absoluteCenter({ axis: 'x' })}>3</div>
      <button
        className={css({
          fontSize: '15px',
          background: { _: 'red', md: 'pink' },
          border: '1px solid marron',
        })}
      >
        {children}
      </button>
    </div>
  )
}
