import { css } from '../styled-system/css'

export function Button({ children }) {
  return (
    <button
      className={css({
        background: 'red',
        color: 'white',
        fontSize: '20px',
      })}
    >
      {children}
    </button>
  )
}
