import type { SemanticTokens } from '@pandacss/types'

export const semanticShadows: SemanticTokens['shadows'] = {
  overflow: {
    DEFAULT: {
      value: {
        _light: '0px 0px 8px rgba(30, 31, 33, 0.16),0px 0px 1px rgba(30, 31, 33, 0.12)',
        _dark: '0px 0px 12px rgba(1, 4, 4, 0.56),0px 0px 1px rgba(1, 4, 4, 0.5)',
      },
    },
  },
  overlay: {
    value: {
      _light: '0px 8px 12px rgba(30, 31, 33, 0.15),0px 0px 1px rgba(30, 31, 33, 0.31)',
      _dark: '0px 0px 0px rgba(189, 189, 189, 0.12),0px 8px 12px rgba(1, 4, 4, 0.36),0px 0px 1px rgba(1, 4, 4, 0.5)',
    },
  },
  raised: {
    value: {
      _light: '0px 1px 1px rgba(30, 31, 33, 0.25),0px 0px 1px rgba(30, 31, 33, 0.31)',
      _dark: '0px 0px 0px rgba(0, 0, 0, 0),0px 1px 1px rgba(1, 4, 4, 0.5),0px 0px 1px rgba(1, 4, 4, 0.5)',
    },
  },
}
