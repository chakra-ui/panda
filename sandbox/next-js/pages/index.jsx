import { css } from '../styled-system/css'
import { Button } from './button'

export default function Home() {
  return (
    <div className={css({ bg: 'black', minH: '100vh', pt: '140px' })}>
      <div className={css({ maxW: '1200px', mx: 'auto', fontFamily: 'Roboto', textAlign: 'center' })}>
        <div
          className={css({
            color: 'white',
            fontWeight: 'bold',
            fontSize: '4rem',
            lineHeight: '1.2',
          })}
        >
          Rapidly build modern websites without ever leaving your JSX.
        </div>
        <p className={css({ color: 'gray.200', fontSize: 'xl', mt: '40px', maxW: '720px', mx: 'auto' })}>
          A utility-first CSS in TS framework packed with awesomeness like{' '}
          <span className={css({ color: 'tomato' })}>design tokens, style props, and recipes</span> that can be composed
          to build any design, directly in your JSX code.
        </p>

        <Button css={{ mt: '40px', px: '5', py: '3', fontWeight: 'semibold', borderRadius: 'lg', bg: 'tomato' }}>
          Get started
        </Button>
      </div>
    </div>
  )
}
