import type { SlotRecipeConfig } from '@pandacss/types'

export const slotRecipes: Record<string, SlotRecipeConfig> = {
  button: {
    className: 'button',
    slots: ['container', 'icon'],
    base: {
      container: {
        fontFamily: 'mono',
      },
      icon: {
        fontSize: '1.5rem',
      },
    },
    variants: {
      size: {
        sm: {
          container: {
            fontSize: '5rem',
            lineHeight: '1em',
          },
          icon: {
            fontSize: '2rem',
          },
        },

        md: {
          container: {
            fontSize: '3rem',
            lineHeight: '1.2em',
          },
        },
      },
    },
  },
}
