import { css } from '../../styled-system/css/index.js'

export const Header = () => {
  return (
    <header className={css({ pos: 'fixed', left: '0', top: '0', p: '6' })}>
      <h2 className={css({ textStyle: 'lg', fontWeight: 'bold', letterSpacing: 'tight' })}>Waku starter</h2>
    </header>
  )
}
