import type { SemanticTokens } from '@pandacss/types'

export const semanticTokens: SemanticTokens = {
  colors: {
    primary: { value: { base: '{colors.red.500}', _dark: '{colors.red.400}' } },
    secondary: { value: { base: '{colors.red.800}', _dark: '{colors.red.700}' } },
    complex: { value: { base: '{colors.red.800}', _dark: { _hiConstrast: '{colors.red.700}' } } },
    surface: {
      value: {
        _materialTheme: { base: '#m-b', _dark: '#m-d' },
        _pastelTheme: { base: '#p-b', _dark: { md: '#p-d' } },
      },
    },
    button: {
      thick: {
        value: { base: '#fff', _dark: '#000' },
      },
      card: {
        body: {
          value: { base: '#fff', _dark: '#000' },
        },
        heading: {
          value: { base: '#fff', _dark: '#000' },
        },
      },
    },
  },
  spacing: {
    gutter: { value: { base: '{spacing.4}', lg: '{spacing.5}' } },
  },
}
