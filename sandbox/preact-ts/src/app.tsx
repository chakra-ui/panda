import { css } from '../styled-system/css'
import { bleed, cq, stack } from '../styled-system/patterns'

export const App = () => {
  return (
    <div style={{ '--gap': '40px' }} className={css({ h: 'full' })}>
      <div className={css({ h: 'full', p: 'var(--gap)', bg: 'cyan' })}>
        <div className={bleed({ bg: 'magenta', inline: 'var(--gap)' })}>
          <span>🐼</span>
          <span>Hello from Panda</span>
        </div>

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
