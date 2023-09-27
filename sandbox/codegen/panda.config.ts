import { defineConfig, defineRecipe, defineSlotRecipe } from '@pandacss/dev'

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
  ],
})

export default defineConfig({
  // Whether to use css reset
  preflight: true,

  // Where to look for your css declarations
  include: ['./src/**/*.{js,jsx,ts,tsx}', './pages/**/*.{js,jsx,ts,tsx}'],

  // Files to exclude
  exclude: [],

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

  // The output directory for your css system
  outdir: 'styled-system',

  // The JSX framework to use
  jsxFramework: 'react',
  globalCss: {
    html: {
      lineHeight: 1.5,
      textRendering: 'optimizeLegibility',
      MozOsxFontSmoothing: 'grayscale',
      WebkitFontSmoothing: 'antialiased',
      WebkitTextSizeAdjust: '100%',
      height: '100%',
    },
    'body, #root': {
      display: 'flex',
      flexDirection: 'column',
      minHeight: 'full',
      height: '100%',
      maxHeight: '100%',
      _dark: {
        colorScheme: 'dark',
        bg: '#282828',
      },
    },
  },
})
