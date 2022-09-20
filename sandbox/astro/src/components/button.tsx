import { css } from '../../panda/css'

export function Button({ children }) {
  return (
    <div class={css({ display: 'flex', justifyContent: 'center' })}>
      <button
        class={css({
          margin: '40px auto',
          background: 'red',
          color: 'white',
          fontSize: '40px',
          fontFamily: 'sans-serif',
        })}
      >
        {children}
      </button>
    </div>
  )
}
