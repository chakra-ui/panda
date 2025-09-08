import { defineSemanticTokens } from '@pandacss/dev'

export const semanticTokens = defineSemanticTokens({
  colors: {
    // Background tokens
    bg: {
      DEFAULT: {
        value: { base: '{colors.white}', _dark: '{colors.dark}' }
      },
      subtle: {
        value: { base: '{colors.neutral.50}', _dark: '{colors.neutral.900}' }
      },
      muted: {
        value: { base: '{colors.neutral.100}', _dark: '{colors.neutral.800}' }
      },
      surface: {
        value: { base: '{colors.white}', _dark: '{colors.neutral.900}' }
      },
      inverted: {
        value: { base: '{colors.black}', _dark: '{colors.neutral.700}' }
      },
      main: {
        value: { base: '{colors.yellow.300}', _dark: '{colors.neutral.700}' }
      },
      emphasized: {
        value: { base: '{colors.white}', _dark: '{colors.yellow.300}' }
      },
      'emphasized.hover': {
        value: { base: '{colors.neutral.100}', _dark: '{colors.neutral.800}' }
      }
    },

    // Foreground tokens
    fg: {
      DEFAULT: {
        value: { base: '{colors.neutral.900}', _dark: '{colors.neutral.100}' }
      },
      muted: {
        value: { base: '{colors.neutral.600}', _dark: '{colors.neutral.400}' }
      },
      subtle: {
        value: { base: '{colors.neutral.500}', _dark: '{colors.neutral.500}' }
      },
      inverted: {
        value: { base: '{colors.white}', _dark: '{colors.black}' }
      },
      headline: {
        value: { base: '{colors.black}', _dark: '{colors.yellow.300}' }
      }
    },

    // Accent tokens
    accent: {
      DEFAULT: {
        value: { base: '{colors.yellow.400}', _dark: '{colors.yellow.300}' }
      },
      emphasis: {
        value: { base: '{colors.yellow.500}', _dark: '{colors.yellow.200}' }
      },
      subtle: {
        value: { base: '{colors.yellow.200}', _dark: '#414012' }
      }
    },

    // Link tokens
    link: {
      DEFAULT: {
        value: { base: '{colors.blue.600}', _dark: '{colors.blue.400}' }
      },
      emphasized: {
        value: { base: '{colors.blue.700}', _dark: '{colors.blue.300}' }
      }
    },

    // Border tokens
    border: {
      DEFAULT: {
        value: { base: '{colors.neutral.200}', _dark: '{colors.neutral.800}' }
      },
      muted: {
        value: { base: '{colors.neutral.100}', _dark: '{colors.neutral.900}' }
      }
    }
  }
})
