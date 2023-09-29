import { definePreset, defineRecipe, defineSlotRecipe } from '@pandacss/dev'

const buttonRecipe = defineRecipe({
  className: 'button',
  description: 'The styles for the Button component',
  base: {
    borderRadius: 'md',
    fontWeight: 'semibold',
    h: '10',
    px: '4',
  },
  variants: {
    visual: {
      solid: {
        bg: { base: 'colorPalette.500', _dark: 'colorPalette.300' },
        color: { base: 'white', _dark: 'gray.800' },
      },
      outline: {
        border: '1px solid',
        color: { base: 'colorPalette.600', _dark: 'colorPalette.200' },
        borderColor: 'currentColor',
      },
    },
  },
})

const slotButton = defineSlotRecipe({
  className: 'slot-button',
  slots: ['root', 'icon'],
  base: {
    root: { borderRadius: 'md', fontWeight: 'semibold', h: '10', px: '4' },
    icon: { fontSize: '2xl' },
  },
  variants: {
    visual: {
      solid: {
        root: {
          bg: { base: 'colorPalette.500', _dark: 'colorPalette.300' },
          color: { base: 'white', _dark: 'gray.800' },
        },
        icon: {
          color: 'white',
        },
      },
      outline: {
        root: {
          border: '1px solid',
          color: { base: 'colorPalette.600', _dark: 'colorPalette.200' },
          borderColor: 'currentColor',
        },
        icon: {
          border: '1px solid',
        },
      },
    },
  },
})

const buttonWithCompoundVariantsRecipe = defineRecipe({
  className: 'button',
  description: 'The styles for the Button component',
  base: {
    borderRadius: 'md',
    fontWeight: 'semibold',
    h: '10',
    px: '4',
  },
  variants: {
    visual: {
      solid: {
        bg: { base: 'colorPalette.500', _dark: 'colorPalette.300' },
        color: { base: 'white', _dark: 'gray.800' },
      },
      outline: {
        border: '1px solid',
        color: { base: 'colorPalette.600', _dark: 'colorPalette.200' },
        borderColor: 'currentColor',
      },
    },
    size: {
      sm: { fontSize: '1rem' },
      md: { fontSize: '2rem' },
      lg: { fontSize: '3rem' },
    },
  },
  compoundVariants: [
    {
      visual: 'solid',
      css: { color: 'blue' },
    },
    {
      size: 'md',
      visual: 'outline',
      css: { color: 'green' },
    },
    {
      size: ['sm', 'lg'],
      visual: 'outline',
      css: { color: 'red' },
    },
  ],
})

export default definePreset({
  // Useful for theme customization
  theme: {
    extend: {
      recipes: {
        button: buttonRecipe,
        buttonWithCompoundVariants: buttonWithCompoundVariantsRecipe,
      },
      slotRecipes: {
        slotButton,
      },
    },
  },
})
