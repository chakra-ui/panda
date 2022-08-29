import '../__generated__/styles.css'
import { css, fontFace, globalStyle } from '../__generated__/css'
import { Button } from './Button'

fontFace('Roboto Mono', {
  fontDisplay: 'swap',
  fontStyle: 'normal',
  src: ['local("Helvetica Neue Bold")', 'local("HelveticaNeue-Bold")', 'url(MgOpenModernaBold.ttf)'],
})

globalStyle({
  '*, *::before, *::after': {
    borderWidth: '0px',
    borderStyle: 'solid',
  },
})

function App() {
  return (
    <div className={css({ background: 'gray.50', padding: '40px' })}>
      <div
        className={css({
          background: { _: 'white', active: 'gray.200' },
          paddingX: '1rem',
          paddingY: '2rem',
          boxShadow: { _: 'sm', hover: 'md' },
          borderRadius: 'lg',
          marginBottom: '4',
          transitionProperty: 'shadow',
          transitionDuration: '400ms',
          userSelect: 'none',
          fontFamily: 'body',
          display: 'flex',
          flexDirection: 'column',
          gap: '4',

          selectors: {
            '&>*': {
              margin: '0',
            },
          },
        })}
      >
        <p
          className={css({
            fontSize: 'lg',
            fontWeight: 'bold',
            lineHeight: '1',
          })}
        >
          Panda is working!
        </p>
        <p
          className={css({
            color: 'gray.500',
            fontWeight: 'lighter',
          })}
        >
          Panda is working!
        </p>

        <div data-rtl="">
          <div
            className={css({
              divideY: '1px',
              divideColor: 'gray.200',
              selectors: {
                '[data-rtl] & > *': {
                  color: 'red.500',
                },
              },
            })}
          >
            <div>01</div>
            <div>02</div>
            <div>03</div>
          </div>
        </div>
      </div>
      <Button>Click me</Button>
    </div>
  )
}

export default App
