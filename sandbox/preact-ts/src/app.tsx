import { css } from 'styled-system/css'
import { styled } from 'styled-system/jsx'
import { stack } from 'styled-system/patterns'
import { btn } from 'styled-system/recipes'

const Notice = styled('div', {
  base: {
    bg: 'red',
    color: 'white',
    padding: '2',
    borderRadius: 'md',
  },
})

export const App = () => {
  return (
    <>
      <Notice unstyled bg="pink" color="green">
        Hello
      </Notice>
      <div className={stack()}>
        <a className={css({ mb: '3', paddingEnd: '2' })}>Click me</a>
      </div>
      <div className={css({ color: 'yellow' })}></div>
      <div className={btn()}>aaaa Click me</div>
    </>
  )
}
