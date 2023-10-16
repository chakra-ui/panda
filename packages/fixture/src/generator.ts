import type { ConfigResultWithHooks } from '@pandacss/types'
import { createHooks } from 'hookable'
import { createGenerator } from '@pandacss/generator'
import {
  breakpoints,
  conditions,
  keyframes,
  patterns,
  recipes,
  semanticTokens,
  slotRecipes,
  tokens,
  utilities,
} from './'

export const generatorConfig = {
  dependencies: [],
  config: {
    optimize: true,
    cwd: '',
    outdir: 'styled-system',
    include: [],
    //
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
  },
  path: '',
  hooks: createHooks(),
} as ConfigResultWithHooks
export const generator = createGenerator(generatorConfig)
