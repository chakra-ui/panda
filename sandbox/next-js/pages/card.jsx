import { css } from '../styled-system/css'

export function Card({ children }) {
  return (
    <div
      className={css({
        background: 'pink',
        boxShadow: 'md',
        maxWidth: '200px',
        fontFamily: 'body',
        paddingX: '24px',
        paddingY: '32px',
        marginTop: '20px',
      })}
    >
      {children}
    </div>
  )
}
