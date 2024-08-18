import type { MetaFunction } from '@remix-run/node'
import { css } from '../../styled-system/css'

export const meta: MetaFunction = () => {
  return [{ title: 'New Remix App' }, { name: 'description', content: 'Welcome to Remix!' }]
}

export default function Index() {
  return (
    <div className={css({ paddingY: '40px', debug: true })}>
      <h1 className={css({ fontFamily: 'Dosis', fontWeight: 'medium' })}>Welcome home</h1>
    </div>
  )
}
