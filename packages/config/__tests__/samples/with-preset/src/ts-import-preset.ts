import { definePreset, defineSemanticTokens } from '@pandacss/dev'

export const tsImportPreset = definePreset({
  theme: {
    extend: {
      semanticTokens: defineSemanticTokens({
        colors: {
          placeholder: {
            value: { base: '{colors.gray.600}', _dark: '{colors.gray.400}' },
          },
          inverted: {
            default: { value: { base: 'white', _dark: '{colors.black}' } },
          },
        },
      }),
    },
  },
})
