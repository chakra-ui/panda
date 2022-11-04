import { css } from '../styled-system/css'

export function Button({ children, css: cssProp }) {
  return (
    <button
      className={css({
        background: 'red',
        color: 'white',
        fontSize: '20px',
        ...cssProp,
      })}
    >
      {children}
    </button>
  )
}
