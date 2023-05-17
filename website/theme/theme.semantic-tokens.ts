import { defineSemanticTokens } from '@pandacss/dev'

export const semanticTokens = defineSemanticTokens({
  colors: {
    panda: {
      bg: {
        main: {
          value: {
            base: '{colors.panda.yellow}',
            _dark: '{colors.panda.yellowDark}'
          }
        },
        muted: {
          value: {
            base: '{colors.panda.gray.900}',
            _dark: '{colors.panda.gray.400}'
          }
        },
        dark: {
          value: {
            base: '{colors.black}',
            _dark: '{colors.panda.gray.400}'
          }
        },
        inverted: {
          value: { base: '{colors.white}', _dark: '{colors.black}' }
        },
        emphasized: {
          value: { base: '{colors.white}', _dark: '{colors.panda.yellow}' }
        }
      },
      text: {
        main: {
          value: { base: '{colors.black}', _dark: '{colors.white}' }
        },
        headline: {
          value: { base: '{colors.black}', _dark: '{colors.panda.yellow}' }
        },
        muted: {
          value: {
            base: '{colors.panda.gray.300}',
            _dark: '{colors.panda.gray.50}'
          }
        }
      }
    }
  }
})
