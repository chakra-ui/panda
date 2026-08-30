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
      maskImage:
        'linear-gradient(to right, transparent, black 5rem, black calc(100% - 5rem), transparent)'
    },
    item: {
      display: 'flex',
      alignItems: 'center',
      gap: '2',
      mx: '2',
      whiteSpace: 'nowrap',
      letterSpacing: 'tight'
    }
  })
})
