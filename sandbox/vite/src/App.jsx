import { css, cx, globalStyle } from '../styled-system/css'
import { stack } from '../styled-system/patterns'
import '../styled-system/styles.css'

globalStyle({
  '*': {
    fontFamily: 'Roboto',
  },
})

function App() {
  return (
    <div className={css({ paddingY: '80px' })}>
      <div className={css({ maxWidth: '640px', marginX: 'auto', textAlign: 'center' })}>
        <div className={stack({ align: 'center' })}>
          <h1 className={css({ color: 'gray.600', fontSize: '56px', lineHeight: '1.1em' })}>
            Create accessible React apps <span className={css({ color: 'teal' })}>with speed</span>
          </h1>
          <p className={css({ color: 'gray.500', marginTop: '20px', fontSize: '20px' })}>
            Chakra UI is a simple, modular and accessible component library that gives you the building blocks you need
            to build your React applications.
          </p>

          <div className={cx(stack({ direction: 'row', gap: '24px' }), css({ marginTop: '40px' }))}>
            <button
              className={css({
                height: '40px',
                background: 'teal',
                color: 'white',
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
