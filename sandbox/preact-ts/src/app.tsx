import { css } from 'styled-system/css'
import { stack } from 'styled-system/patterns'
import { btn } from 'styled-system/recipes'

export const App = () => {
  return (
    <>
      <div className={stack()}>
        <a className={css({ mb: '3', paddingEnd: '2' })}>Click me</a>
      </div>
      <div className={css({ color: 'yellow' })}></div>
      <div className={btn()}>aaaa Click me</div>
    </>
  )
}
