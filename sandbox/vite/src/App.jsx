import { css, globalCss } from '../design-system/css'
import { circle, vstack } from '../design-system/patterns'
import { Stack, panda, Circle, HStack } from '../design-system/jsx'

globalCss({
  '*': {
    fontFamily: 'Inter',
    margin: '0',
  },
})

function App() {
  return (
    <div className={css({ paddingY: '50px', bg: 'teal' })}>
      <Stack align="center" padding="20px" marginBottom="30px" bg="yellow" gap={{ base: '4', md: '10' }}>
        <Circle size="40px" bg="red.300" fontSize="1.2em" fontWeight="bold">
          S
        </Circle>
        <HStack gap="40px">
          <div>Element 1</div>
          <panda.div color="red" fontWeight="bold" fontSize="50px">
            Element 2
          </panda.div>
        </HStack>
      </Stack>
      <div className={css({ maxWidth: '840px', marginX: 'auto', textAlign: 'center' })}>
        <div>
          <div className={vstack({ justify: 'center', bg: 'red.200', py: '2', mb: '30px' })}>
            <button>Button 1</button>
            <button>Button 2</button>
            <div className={circle({ size: '10', bg: 'purple', color: 'white' })}>3</div>
          </div>
          <h1 className={css({ color: 'black', fontSize: '56px', lineHeight: '1.1em' })}>
            Create accessible React apps <span className={css({ color: 'teal' })}>with speed</span>
          </h1>
          <p className={css({ color: 'text', fontSize: '20px', marginTop: '40px' })}>
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
