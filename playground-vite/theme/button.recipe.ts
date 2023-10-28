import { defineRecipe, defineStyles } from '@pandacss/dev'

// https://github.com/chakra-ui/chakra-ui/blob/f4b1ad66be1ada4b2728faef4c68a82a76f02532/packages/theme/src/components/button.ts
// https://github.com/chakra-ui/chakra-ui/blob/f4b1ad66be1ada4b2728faef4c68a82a76f02532/packages/components/src/button/button.tsx#L60

const variantGhostStyles = defineStyles({
  color: { base: `colorPalette.600`, _dark: `colorPalette.200` },
  bg: 'transparent',
  _hover: {
    backgroundAlpha: { base: `colorPalette.50`, _dark: 'colorPalette.200/12' },
  },
  _active: {
    backgroundAlpha: { base: `colorPalette.100`, _dark: 'colorPalette.200/24' },
  },
})

export const buttonRecipe = defineRecipe({
  className: 'btn',
  base: {
    lineHeight: '1.2',
    borderRadius: 'md',
    fontWeight: 'semibold',
    transitionProperty: 'common',
    transitionDuration: 'normal',
    _focusVisible: { boxShadow: 'outline' },
    _disabled: { opacity: 0.4, cursor: 'not-allowed', boxShadow: 'none' },
    _hover: { _disabled: { bg: 'initial' } },
    // https://github.com/chakra-ui/chakra-ui/blob/f4b1ad66be1ada4b2728faef4c68a82a76f02532/packages/components/src/button/button.tsx#L60
    display: 'inline-flex',
    appearance: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none',
    position: 'relative',
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
    outline: 'none',
    _focus: {
      zIndex: 1,
    },
  },

  variants: {
    variant: {
      ghost: variantGhostStyles,
      outline: {
        border: '1px solid',
        borderColor: {
          base: 'currentColor',
        },
        ...variantGhostStyles, // Since outline uses ghost styles as well
      },
      solid: {
        bg: { base: 'colorPalette.500', _dark: 'colorPalette.200' },
        color: { base: 'white', _dark: 'gray.800' },
        _hover: {
          bg: { base: 'colorPalette.600', _dark: 'colorPalette.300' },
          _disabled: {
            bg: { base: 'colorPalette.500', _dark: 'colorPalette.200' },
          },
        },
        _active: {
          bg: { base: 'colorPalette.700', _dark: 'colorPalette.400' },
        },
      },
      link: {
        padding: 0,
        height: 'auto',
        lineHeight: 'normal',
        verticalAlign: 'baseline',
        color: { base: 'colorPalette.500', _dark: 'colorPalette.200' },
        _hover: {
          textDecoration: 'underline',
          _disabled: { textDecoration: 'none' },
        },
        _active: {
          color: { base: 'colorPalette.700', _dark: 'colorPalette.500' },
        },
      },
      unstyled: {
        bg: 'none',
        color: 'inherit',
        display: 'inline',
        lineHeight: 'inherit',
        m: '0',
        p: '0',
      },
    },
    colorPalette: {
      gray: {},
      teal: {},
    },
    size: {
      lg: { h: '12', minW: '12', fontSize: 'lg', px: '6' },
      md: { h: '10', minW: '10', fontSize: 'md', px: '4' },
      sm: { h: '8', minW: '8', fontSize: 'sm', px: '3' },
      xs: { h: '6', minW: '6', fontSize: 'xs', px: '2' },
    },
  },
  compoundVariants: [
    {
      variant: 'ghost',
      colorPalette: 'gray',
      css: {
        color: { base: 'gray.800', _dark: 'whiteAlpha.900' },
        _hover: { bg: { base: 'gray.100', _dark: 'whiteAlpha.200' } },
        _active: { bg: { base: 'gray.200', _dark: 'whiteAlpha.300' } },
      },
    },
    {
      variant: 'outline',
      colorPalette: 'gray',
      css: {
        borderColor: { base: 'gray.200', _dark: 'whiteAlpha.300' },
      },
    },
    {
      variant: 'solid',
      colorPalette: 'gray',
      css: {
        bg: { base: 'gray.100', _dark: 'whiteAlpha.200' },
        color: { base: 'gray.800', _dark: 'whiteAlpha.900' },
        _hover: {
          bg: { base: 'gray.200', _dark: 'whiteAlpha.300' },
          _disabled: {
            bg: { base: 'gray.100', _dark: 'whiteAlpha.200' },
          },
        },
        _active: { bg: { base: 'gray.300', _dark: 'whiteAlpha.400' } },
      },
    },
  ],
  defaultVariants: {
    colorPalette: 'gray',
    variant: 'solid',
    size: 'md',
  },
})
