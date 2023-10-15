import {
  breakpoints,
  conditions,
  keyframes,
  semanticTokens,
  tokens,
  utilities,
  recipes,
  slotRecipes,
  patterns,
} from '@pandacss/fixture'
import { createGenerator } from '../src'
import { createHooks } from 'hookable'
import type { ConfigResultWithHooks } from '@pandacss/types'

export const generatorConfig = {
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
      slotRecipes,
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
} as ConfigResultWithHooks
export const generator = createGenerator(generatorConfig)
