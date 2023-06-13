import {
  breakpoints,
  conditions,
  keyframes,
  semanticTokens,
  tokens,
  utilities,
  recipes,
  patterns,
} from '@pandacss/fixture'
import { createGenerator } from '../src'
import { createHooks } from 'hookable'

export const generator = createGenerator({
  dependencies: [],
  config: {
    cwd: '',
    include: [],
    utilities,
    patterns,
    theme: {
      tokens,
      semanticTokens,
      breakpoints,
      keyframes,
      recipes,
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
  hooks: createHooks(),
})
