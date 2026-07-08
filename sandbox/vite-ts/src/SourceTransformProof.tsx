import { css, sva } from '../styled-system/css'
import { Box, Circle, HStack, Square, Wrap, panda } from '../styled-system/jsx'
import { grid } from '../styled-system/patterns'

const proofSlots = sva({
  slots: ['root', 'item'],
  className: 'proof-slot',
  base: {
    root: {
      display: 'flex',
      gap: '2',
    },
    item: {
      fontWeight: 'medium',
    },
  },
  variants: {
    tone: {
      info: {
        item: {
          color: 'blue.500',
        },
      },
    },
  },
  defaultVariants: {
    tone: 'info',
  },
})

const ProofIcon = (props: React.ComponentProps<'svg'>) => (
  <svg viewBox="0 0 16 16" aria-hidden="true" {...props}>
    <circle cx="8" cy="8" r="6" />
  </svg>
)

export function SourceTransformProof() {
  const slots = proofSlots()

  return (
    <section className={css({ borderTopWidth: '1px', mt: '8', pt: '6' })}>
      <p className={css({ fontWeight: 'semibold', mb: '3' })}>Source Transform Proof</p>

      <HStack gap="3" css={{ color: 'orange.400' }}>
        <panda.footer color="red.400" fontWeight="bold">
          panda.footer proof
        </panda.footer>
        <Box as={ProofIcon} color="blue.400" />
      </HStack>

      <Wrap gap="4" justify="center" mt="4">
        <Circle size="10" bg="pink.200">
          C
        </Circle>
        <Square size="10" bg="blue.200">
          S
        </Square>
      </Wrap>

      <div className={grid({ minChildWidth: '11rem', gap: '2', mt: '4' })}>
        <div className={css({ bg: 'green.100', p: '2' })}>grid one</div>
        <div className={css({ bg: 'green.100', p: '2' })}>grid two</div>
      </div>

      <article className={slots.root}>
        <span className={slots.item}>slot recipe proof</span>
      </article>
    </section>
  )
}
