import { defineSemanticTokens } from '@pandacss/dev'

export const semanticTokens = defineSemanticTokens({
  colors: {
    bg: {
      main: {
        value: {
          base: '{colors.yellow.300}',
          _dark: '{colors.gray.700}'
        }
      },
      muted: {
        value: {
          base: '{colors.gray.900}',
          _dark: '{colors.gray.400}'
        }
      },
      dark: {
        value: {
          base: '{colors.black}',
          _dark: '{colors.gray.400}'
        }
      },
      inverted: {
        value: { base: '{colors.white}', _dark: '{colors.black}' }
      },
      emphasized: {
        value: { base: '{colors.white}', _dark: '{colors.yellow.300}' }
      },
      'emphasized.hover': {
        value: {
          base: '{colors.gray.100}',
          _dark: '{colors.gray.800}'
        }
      }
    },
    text: {
      main: {
        value: { base: '{colors.black}', _dark: '{colors.white}' }
      },
      headline: {
        value: { base: '{colors.black}', _dark: '{colors.yellow.300}' }
      },
      muted: {
        value: {
          base: '{colors.gray.800}',
          _dark: '{colors.gray.50}'
        }
      }
    }
  }
})
