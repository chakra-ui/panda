import { css, globalCss } from '../design-system/css'

globalCss({
  '*': {
    fontFamily: 'Inter',
    margin: '0',
  },
})

function App() {
  return (
    <div className={css({ paddingY: '180px' })}>
      <div className={css({ maxWidth: '840px', marginX: 'auto', textAlign: 'center' })}>
        <div>
          <h1 className={css({ color: 'black', fontSize: '56px', lineHeight: '1.1em' })}>
            Create accessible React apps <span className={css({ color: 'teal' })}>with speed</span>
          </h1>
          <p className={css({ color: { _: 'gray.500', hover: 'red' }, fontSize: '20px', marginTop: '40px' })}>
            Chakra UI is a simple, modular and accessible component library that gives you the building blocks you need
            to build your React applications.
          </p>

          <div className={css({ marginTop: '40px', display: 'inline-flex', spaceX: '4' })}>
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
