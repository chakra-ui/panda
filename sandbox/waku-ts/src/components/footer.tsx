import { css } from '../../styled-system/css/index.js'

export const Footer = () => {
  return (
    <footer className={css({ pos: 'fixed', bottom: '0', left: '0', p: '6' })}>
      <div>
        visit{' '}
        <a
          href="https://waku.gg/"
          target="_blank"
          rel="noreferrer"
          className={css({ mt: '4', display: 'inline-block', textDecoration: 'underline' })}
        >
          waku.gg
        </a>{' '}
        to learn more
      </div>
    </footer>
  )
}
