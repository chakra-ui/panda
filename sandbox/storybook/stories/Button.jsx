import { css } from '../styled-system/css'

export const Button = ({ children }) => {
  return <button className={css({ bg: 'red.300' })}>{children}</button>
}
