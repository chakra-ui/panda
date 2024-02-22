import { css } from '../styled-system/css'
import { bleed, cq, stack } from '../styled-system/patterns'

export const App = () => {
  return (
    <>
      <div className={cq()}>
        <a className={css({ bg: { '@/sm': 'red.300' } })}>Click me</a>
      </div>
      <div
        className={css({
          sm: {
            color: 'yellow',
          },
          _focus: {
            color: 'blue',
          },
          _supportHover: {
            color: 'red.200',
          },
        })}
      ></div>
    </>
  )
}
