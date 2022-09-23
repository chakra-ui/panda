import { css, cx, globalStyle } from '../styled-system/css'
import { stack } from '../styled-system/patterns'

globalStyle({
  '*': {
    fontFamily: 'Inter',
    margin: '0',
  },
})

function App() {
  return (
    <div className={css({ paddingY: '30px' })}>
      <div className={css({ maxWidth: '840px', marginX: 'auto', textAlign: 'center' })}>
        <div className={stack({ align: 'center' })}>
          <h1 className={css({ color: 'gray.600', fontSize: '56px', lineHeight: '1.1em' })}>
            Create accessible React apps <span className={css({ color: 'teal' })}>with speed</span>
          </h1>
          <p className={css({ color: { _: 'gray.500', hover: 'red' }, fontSize: '20px', marginTop: '40px' })}>
            Chakra UI is a simple, modular and accessible component library that gives you the building blocks you need
            to build your React applications.
          </p>

          <div className={cx(stack({ direction: 'row', gap: '12px' }), css({ marginTop: '40px' }))}>
            <button
              className={css({
                height: '40px',
                background: 'red.200',
                color: 'red.500',
                borderRadius: '8px',
                paddingX: '24px',
                translate: { active: '0 3px' },
              })}
            >
              Get Started
            </button>
            <button
              className={css({
                height: '40px',
                background: 'gray.200',
                borderRadius: '8px',
                paddingX: '24px',
              })}
            >
              Github
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
