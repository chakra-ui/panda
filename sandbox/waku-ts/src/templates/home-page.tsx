import { Link } from 'waku'

import { Counter } from '../components/counter.js'
import { css } from '../../styled-system/css/index.js'
import { MultiThemes } from '../components/multi-themes.js'

export const HomePage = async () => {
  const data = await getData()

  return (
    <div>
      <title>{data.title}</title>
      <h1 className={css({ textStyle: '4xl', fontWeight: 'bold', letterSpacing: 'tight' })}>{data.headline}</h1>
      <p>{data.body}</p>
      <Counter />
      <Link to="/about" className={css({ mt: '4', display: 'inline-block', textDecoration: 'underline' })}>
        Learn more
      </Link>
      <MultiThemes />
    </div>
  )
}

const getData = async () => {
  const data = {
    title: 'Waku',
    headline: 'Waku',
    body: 'Hello world!',
  }

  return data
}
