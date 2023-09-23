import { css, cx } from '../styled-system/css'
import { Circle, HStack, Stack, panda } from '../styled-system/jsx'
import { circle as circleLike, stack, vstack } from '../styled-system/patterns'
import { button, someRecipe } from '../styled-system/recipes'
import { Badge, badge } from './Badge'
import { AnotherButtonWithRegex, Button, ListedButton } from './Button'
import { Card } from './Card'
import { motion, isValidMotionProp } from 'framer-motion'

const SomeRecipe = panda('div', someRecipe)

const StyledMotion = panda(
  motion.div,
  {},
  {
    /*  Allow motion props and non-style props to be forwarded. */
    shouldForwardProp: (prop, isCssProperty, variantKeys) =>
      isValidMotionProp(prop) || (!variantKeys.includes(prop) && !isCssProperty(prop)),
  },
)

const PrimaryButtonLike = panda('span', button, {
  dataAttr: true,
  defaultProps: {
    display: 'inline-flex',
    variant: 'purple',
    w: '255px',
    _hover: { color: 'amber.100' },
  },
  shouldForwardProp: (prop, _isCssProp, _variantKeys) => {
    return !prop.startsWith('_')
  },
})

function App() {
  const paddingY = '25px'
  const className = css({ padding: paddingY, fontSize: paddingY ? '2xl' : '4xl' })

  return (
    <div className={stack({ padding: '40px', align: 'stretch' })}>
      <section className={css({ padding: '5', borderWidth: '1px' })}>
        <p className={css({ fontWeight: 'semibold', mb: '2' })}>CSS - Function</p>
        <div className={css({ maxWidth: '840px', marginX: 'auto', textAlign: 'center' })}>
          <div>
            <h1 className={css({ color: 'black', fontSize: '56px', lineHeight: '1.1em' })}>
              Create accessible React apps <span className={css({ color: 'teal' })}>with speed</span>
            </h1>
            <p className={css({ color: 'text', fontSize: '20px', marginTop: '40px' })}>
              Chakra UI is a simple, modular and accessible component library that gives you the building blocks you
              need to build your React applications.
            </p>

            <div className={css({ marginTop: '40px', display: 'inline-flex', gap: '4' })}>
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
      </section>

      <section className={css({ padding: '5', borderWidth: '1px' })}>
        <p className={css({ fontWeight: 'semibold', mb: '2' })}>Recipe - JSX</p>
        <Button aria-label="Hello World" variant="danger" size="md">
          Hello
        </Button>
        <ListedButton aria-label="Listed" variant="primary" size="md">
          Listed
        </ListedButton>
        <AnotherButtonWithRegex aria-label="AnotherButtonWithRegex" variant="secondary" size="sm">
          AnotherButtonWithRegex
        </AnotherButtonWithRegex>
        <PrimaryButtonLike>Default props override</PrimaryButtonLike>
        <StyledMotion
          animate={{
            scale: [1, 2, 2, 1, 1],
            rotate: [0, 0, 270, 270, 0],
            borderRadius: ['20%', '20%', '50%', '50%', '20%'],
          }}
          transition={{
            // @ts-ignore no problem in operation, although type error appears.
            duration: 3,
            ease: 'easeInOut',
            repeat: Infinity,
            repeatType: 'loop',
          }}
          padding="2"
          bgGradient="to-l"
          gradientFrom="#7928CA"
          gradientTo="#FF0080"
          display="flex"
          justifyContent="center"
          alignItems="center"
          width="100px"
          height="100px"
        >
          I'm Dizzy!
        </StyledMotion>
      </section>

      <section className={css({ padding: '5', borderWidth: '1px' })}>
        <p className={css({ fontWeight: 'semibold', mb: '2' })}>CVA - JSX</p>
        <Card size="sm" shape="square" width="400px">
          size:sm + open:true
        </Card>
        <Card shape="circle" open>
          size:xs + open:true + shape:square
        </Card>
        <Badge status="success" background="pink.800">
          Welcome
        </Badge>
      </section>

      <section className={css({ padding: '5', borderWidth: '1px' })}>
        <p className={css({ fontWeight: 'semibold', mb: '2' })}>Pattern - JSX</p>
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
      </section>

      <section className={css({ padding: '5', borderWidth: '1px' })}>
        <p className={css({ fontWeight: 'semibold', mb: '2' })}>Pattern - Function</p>
        <div className={vstack({ justify: 'center', bg: 'red.200', py: '2', mb: '30px', debug: true })}>
          <button className={cx(button({ variant: 'primary', state: 'focused' }), css({ color: 'yellow' }))}>
            Click me
          </button>
          <button>Button 1</button>
          <button>Button 2</button>
          <div className={circleLike({ size: '10', bg: 'purple', color: 'white' })}>3</div>
        </div>
      </section>

      <section className={stack({ padding: '5', borderWidth: '1px' })}>
        <p className={css({ fontWeight: 'semibold', mb: '2' })}>CVA - Function</p>
        <div className={badge({ status: 'warning' })}>Warning</div>
        <div className={badge({ status: 'success' })}>Warning</div>
      </section>

      <SomeRecipe size="small" color="red.400">
        config recipe compoundVariants overriding within styled, should be red.100
      </SomeRecipe>
    </div>
  )
}

export default App
