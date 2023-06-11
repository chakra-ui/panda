import { defineSemanticTokens } from '@pandacss/dev'

export const semanticTokens = defineSemanticTokens({
  colors: {
    background: {
      value: { base: 'hsl(0 0% 100%)', _dark: 'hsl(224 71% 4%)' },
    },
    foreground: {
      value: {
        base: 'hsl(222.2 47.4% 11.2%)',
        _dark: 'hsl(213 31% 91%)',
      },
    },
  },
})
