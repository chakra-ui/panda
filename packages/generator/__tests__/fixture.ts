import { breakpoints, keyframes, semanticTokens, tokens, utilities } from '@pandacss/fixture'
import { conditions } from '@pandacss/fixture'
import type { LoadConfigResult } from '@pandacss/types'

export const loadConfigResult: LoadConfigResult = {
  dependencies: [],
  config: {
    cwd: '',
    include: [],
    utilities,
    theme: {
      tokens,
      semanticTokens,
      breakpoints,
      keyframes,
    },
    cssVarRoot: ':where(html)',
    conditions: {
      ...conditions,
      dark: '[data-theme=dark] &, .dark &, &.dark, &[data-theme=dark]',
      light: '[data-theme=light] &, .light &, &.light, &[data-theme=light]',
    },
    outdir: '',
  },
  path: '',
}
