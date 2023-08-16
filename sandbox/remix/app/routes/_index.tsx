import { css, cx } from 'styled-system/css'
import { circle, vstack } from 'styled-system/patterns'
import { Stack, styled, Circle, HStack } from 'styled-system/jsx'
import { button } from 'styled-system/recipes'
import { Button } from 'app/components/Button'
import { badge, Badge } from 'app/components/Badge'
import type { V2_MetaFunction } from '@remix-run/node'

export const meta: V2_MetaFunction = () => {
  return [{ title: 'New Remix App' }, { name: 'description', content: 'Welcome to Remix!' }]
}

export default function Index() {
  return (
    <div className={css({ paddingY: '40px', debug: true })}>
      <Button
        aria-label="Hello World"
        variant="danger"
        size={{ base: 'sm', md: 'md' }}
        css={{ color: 'yellow', transform: 'auto', scale: '1.1' }}
      >
        Hello wow
      </Button>
      <button className={cx(button({ variant: 'primary' }), css({ color: 'yellow' }))}>Click me</button>
      <Stack align="center" padding="20px" marginBottom="30px" bg="green.100" gap={{ base: '4', md: '10' }}>
        <Circle size="40px" bg="red.300" fontSize="1.2em" fontWeight="bold">
          S
        </Circle>
        <HStack gap="40px" debug>
          <div>Element 1</div>
          <styled.div color="red" fontWeight="bold" fontSize="50px">
            Element 2
          </styled.div>
        </HStack>
      </Stack>
      <div className={css({ maxWidth: '840px', marginX: 'auto', textAlign: 'center' })}>
        <div>
          <div className={vstack({ justify: 'center', bg: 'red.200', py: '2', mb: '30px', debug: true })}>
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

          <div className={css({ marginTop: '40px', display: 'inline-flex' })}>
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
    </div>
  )
}
