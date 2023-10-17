import { mergeConfigs } from '@pandacss/config'
import { createGenerator } from '@pandacss/generator'
import { createContext as actualCreateContext } from '@pandacss/node'
import type { Config, ConfigResultWithHooks, UserConfig } from '@pandacss/types'
import { createHooks } from 'hookable'
import { fixturePreset } from './config'

export const fixtureDefaults = {
  dependencies: [],
  config: {
    ...fixturePreset,
    optimize: true,
    cwd: '',
    outdir: 'styled-system',
    include: [],
    //
    cssVarRoot: ':where(html)',
  },
  path: '',
  hooks: createHooks(),
} as ConfigResultWithHooks

export const createGeneratorContext = (userConfig?: Config) => {
  const resolvedConfig = (
    userConfig ? mergeConfigs([fixtureDefaults.config, userConfig]) : fixtureDefaults.config
  ) as UserConfig

  return createGenerator({ ...fixtureDefaults, config: resolvedConfig })
}

export const createContext = (userConfig?: Config) => {
  const resolvedConfig = (
    userConfig ? mergeConfigs([fixtureDefaults.config, userConfig]) : fixtureDefaults.config
  ) as UserConfig

  return actualCreateContext({
    ...fixtureDefaults,
    config: resolvedConfig,
    tsconfig: {
      // @ts-expect-error
      useInMemoryFileSystem: true,
    },
  })
}
