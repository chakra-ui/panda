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
import { createHooks } from 'hookable'
import type { ConfigResultWithHooks, UserConfig } from '@pandacss/types'
import { Generator } from '../src'

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

const serializeConfig = (config: UserConfig) =>
  JSON.stringify(config, (_key, value) => {
    if (typeof value === 'function') return value.toString()
    return value
  })

export const generatorConfig = {
  dependencies: [],
  config,
  path: '',
  hooks: createHooks(),
  serialized: serializeConfig(config),
  deserialize: () => JSON.parse(serializeConfig(config)),
} as ConfigResultWithHooks

export const generator = new Generator(generatorConfig)
