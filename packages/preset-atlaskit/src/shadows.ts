import type { SemanticTokens } from '@pandacss/types'

export const semanticShadows: SemanticTokens['shadows'] = {
  overflow: {
    value: {
      _light: '0px 0px 8px rgba(9, 30, 66, 0.16),0px 0px 1px rgba(9, 30, 66, 0.12)',
      _dark: '0px 0px 12px rgba(3, 4, 4, 0.56),0px 0px 1px rgba(3, 4, 4, 0.5)',
    },
  },
  overlay: {
    value: {
      _light: '0px 8px 12px rgba(9, 30, 66, 0.15),0px 0px 1px rgba(9, 30, 66, 0.31)',
      _dark: '0px 0px 0px rgba(188, 214, 240, 0.04),0px 8px 12px rgba(3, 4, 4, 0.36),0px 0px 1px rgba(3, 4, 4, 0.5)',
    },
  },
  raised: {
    value: {
      _light: '0px 1px 1px rgba(9, 30, 66, 0.25),0px 0px 1px rgba(9, 30, 66, 0.31)',
      _dark: '0px 0px 0px rgba(0, 0, 0, 0),0px 1px 1px rgba(3, 4, 4, 0.5),0px 0px 1px rgba(3, 4, 4, 0.5)',
    },
  },
}
