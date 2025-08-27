import type { MetaFunction } from '@remix-run/node'
import { css } from '../../styled-system/css'
import { styled } from '../../styled-system/jsx'

export const meta: MetaFunction = () => {
  return [{ title: 'New Remix App' }, { name: 'description', content: 'Welcome to Remix!' }]
}

const Notice = styled('div', {
  base: {
    bg: 'red',
    color: 'white',
    padding: '2',
    borderRadius: 'md',
  },
})

export default function Index() {
  return (
    <div className={css({ paddingY: '40px' })}>
      <Notice bg="pink" color="green">
        Welcome
      </Notice>
      <h1 className={css({ fontFamily: 'Dosis', fontWeight: 'medium' })}>Welcome home</h1>
    </div>
  )
}
