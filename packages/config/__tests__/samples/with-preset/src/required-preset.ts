import { definePreset, defineSemanticTokens } from '@pandacss/dev'

export const requiredPreset = definePreset({
  theme: {
    extend: {
      semanticTokens: defineSemanticTokens({
        colors: {
          muted: {
            value: { base: '{colors.gray.500}', _dark: '{colors.gray.400}' },
          },
          subtle: {
            value: { base: '{colors.gray.400}', _dark: '{colors.gray.500}' },
          },
        },
      }),
    },
  },
})
