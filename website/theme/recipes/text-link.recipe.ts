import { defineRecipe } from '@pandacss/dev'

export const textLinkRecipe = defineRecipe({
  className: 'textLink',
  description: 'Ink text with an accent underline. The mark is the affordance.',
  jsx: ['TextLink'],
  base: {
    color: 'fg',
    fontWeight: 'medium',
    textDecorationLine: 'underline',
    textDecorationStyle: 'solid',
    textDecorationColor: 'accent.emphasis',
    textDecorationThickness: '1px',
    textUnderlineOffset: '3px',
    transitionProperty: 'background-color, text-decoration-color',
    transitionDuration: '150ms',
    _hover: { bg: 'accent.wash' },
    _focusVisible: {
      outline: '2px solid',
      outlineColor: 'blue.500',
      outlineOffset: '2px'
    }
  },
  variants: {
    tone: {
      default: {},
      muted: {
        color: 'fg.muted',
        _hover: { color: 'fg', bg: 'accent.wash' }
      }
    }
  },
  defaultVariants: { tone: 'default' }
})
