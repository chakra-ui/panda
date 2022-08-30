import { css } from '../__generated__/css'

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
