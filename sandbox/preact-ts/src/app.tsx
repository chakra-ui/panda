import { css, xcss } from '../styled-system/css'
import { bleed, cq, stack } from '../styled-system/patterns'
import { xstyled } from '../styled-system/jsx'

const Heading = xstyled.h1`
  font-size: 22px;
  font-weight: bold;
`

export const App = () => {
  return (
    <div style={{ '--gap': '40px' }} className={css({ h: 'full' })}>
      <div className={css({ h: 'full', p: 'var(--gap)', bg: 'cyan' })}>
        <div className={bleed({ bg: 'magenta', inline: 'var(--gap)' })}>
          <span>🐼</span>
          <span>Hello from Panda</span>
        </div>

        <h1
          className={xcss`
          font-size: 56px;
          line-height: 1.1em;
          font-weight: token(fontWeights.bold, 700);
        `}
        >
          Create accessible React apps <span className={css({ color: 'teal' })}>with speed</span>
        </h1>
        <Heading>Heading with xstyled</Heading>

        <div className={stack({ debug: true, mt: '3', gap: '4' })}>
          <p>Welcome home</p>
          <p>Welcome home</p>
        </div>

        <div className={cq()}>
          <a className={css({ bg: { '@/sm': 'red.300' } })}>Click me</a>
        </div>
      </div>
    </div>
  )
}
