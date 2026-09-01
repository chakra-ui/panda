import { marqueeAnatomy } from '@ark-ui/react/marquee'
import { defineParts, defineRecipe } from '@pandacss/dev'

const parts = defineParts(marqueeAnatomy.build())

export const marqueeRecipe = defineRecipe({
  className: 'marquee',
  description: 'A continuous scrolling row that stops under reduced motion',
  jsx: ['FeatureMarquee'],
  base: parts({
    root: {
      bg: 'bg',
      py: '5',
      textStyle: '2xl',
      fontWeight: 'semibold'
    },
    viewport: {
      display: 'flex',
      overflow: 'hidden',
      maskImage:
        'linear-gradient(to right, transparent, black 5rem, black calc(100% - 5rem), transparent)'
    },
    content: {
      display: 'flex',
      flexShrink: '0',
      gap: 'var(--marquee-spacing)',
      minWidth: 'max-content',
      animationName: 'marqueeScroll',
      animationDuration: 'var(--marquee-duration)',
      animationDelay: 'var(--marquee-delay)',
      animationIterationCount: 'var(--marquee-loop-count)',
      animationTimingFunction: 'linear',
      _motionReduce: { animationName: 'none' }
    },
    item: {
      display: 'flex',
      alignItems: 'center',
      // The dot separates two labels, so it has to sit equidistant from both.
      // Ark puts `margin-inline: spacing/2` on every item and `spacing` between
      // them, making the outer gap `2 * spacing`; deriving the inner gap from
      // the same variable keeps the two equal whatever Ark sets it to.
      gap: 'calc(var(--marquee-spacing) * 2)',
      whiteSpace: 'nowrap',
      letterSpacing: 'tight'
    }
  })
})
