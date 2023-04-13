import { css, cx } from '../design-system/css'
import { Circle, HStack, Stack, panda } from '../design-system/jsx'
import { circle as circleLike, vstack } from '../design-system/patterns'
import { button } from '../design-system/recipes'
import { Badge, badge } from './Badge'
import { AnotherButtonWithRegex, Button, ListedButton } from './Button'
import { Card } from './Card'

function App() {
  const paddingY = '25px'
  const className = css({ padding: paddingY, fontSize: paddingY ? '2xl' : '4xl' })
  console.log({ className })

  return (
    <div className={css({ paddingY: '40px', debug: true })}>
      <Button
        aria-label="Hello World"
        variant="danger"
        size="md"
        css={{ color: 'yellow', transform: 'auto', scale: '1.1', x: '40px' }}
      >
        Hello
      </Button>
      <ListedButton
        aria-label="Listed"
        variant="primary"
        size="md"
        css={{ color: 'yellow', transform: 'auto', scale: '1.1', x: '40px' }}
      >
        Listed
      </ListedButton>
      <AnotherButtonWithRegex
        aria-label="AnotherButtonWithRegex"
        variant="secondary"
        size="md"
        css={{ color: 'yellow', transform: 'auto', scale: '1.1', x: '40px' }}
      >
        AnotherButtonWithRegex
      </AnotherButtonWithRegex>
      <Stack align="center" padding="20px" marginBottom="30px" bg="green.100" gap={{ base: '4', md: '10' }}>
        <Circle size="40px" bg="red.300" fontSize="1.2em" fontWeight="bold">
          S
        </Circle>
        <HStack gap="40px" debug>
          <div className={className}>Element 1</div>
          <panda.div color="red" fontWeight="bold" fontSize="50px">
            Element 2
          </panda.div>
        </HStack>
      </Stack>
      <div className={css({ maxWidth: '840px', marginX: 'auto', textAlign: 'center' })}>
        <div>
          <div className={vstack({ justify: 'center', bg: 'red.200', py: '2', mb: '30px', debug: true })}>
            <button className={cx(button({ variant: 'primary', state: 'focused' }), css({ color: 'yellow' }))}>
              Click me
            </button>
            <button>Button 1</button>
            <button>Button 2</button>
            <div className={circleLike({ size: '10', bg: 'purple', color: 'white' })}>3</div>
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
                translate: { _active: '0 3px' },
              })}
            >
              Get Started
            </button>
            <Badge status="success" background="pink.800">
              Welcome
            </Badge>
            <div className={badge({ status: 'warning' })}>Warning</div>
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
      <div>
        <Card size="sm" shape="square">
          size:sm + open:true
        </Card>
        <Card shape="circle" open>
          size:xs + open:true + shape:square
        </Card>
      </div>
    </div>
  )
}

export default App
