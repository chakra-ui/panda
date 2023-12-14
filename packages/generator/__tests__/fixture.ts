import {
  breakpoints,
  conditions,
  keyframes,
  patterns,
  recipes,
  semanticTokens,
  tokens,
  utilities,
} from '@pandacss/fixture'
import { parseJson, stringifyJson } from '@pandacss/shared'
import type { ConfigResultWithHooks, UserConfig } from '@pandacss/types'
import { createHooks } from 'hookable'

const config: UserConfig = {
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
}

export const generatorConfig = {
  dependencies: [],
  config,
  path: '',
  hooks: createHooks(),
  serialized: stringifyJson(config),
  deserialize: () => parseJson(stringifyJson(config)),
} as ConfigResultWithHooks
