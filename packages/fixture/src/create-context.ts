import { mergeConfigs } from '@pandacss/config'
import { Generator } from '@pandacss/generator'
import { PandaContext } from '@pandacss/node'
import { stringifyJson, parseJson } from '@pandacss/shared'
import type { Config, ConfigResultWithHooks, UserConfig } from '@pandacss/types'
import { createHooks } from 'hookable'
import { fixturePreset } from './config'

const config: UserConfig = {
  ...fixturePreset,
  optimize: true,
  cwd: '',
  outdir: 'styled-system',
  include: [],
  //
  cssVarRoot: ':where(html)',
  jsxFramework: 'react',
}

export const fixtureDefaults = {
  dependencies: [],
  config,
  path: '',
  hooks: createHooks(),
  serialized: stringifyJson(config),
  deserialize: () => parseJson(stringifyJson(config)),
} as ConfigResultWithHooks

export const createGeneratorContext = (userConfig?: Config) => {
  const resolvedConfig = (
    userConfig ? mergeConfigs([fixtureDefaults.config, userConfig]) : fixtureDefaults.config
  ) as UserConfig

  return new Generator({ ...fixtureDefaults, config: resolvedConfig })
}

export const createContext = (userConfig?: Config) => {
  const resolvedConfig = (
    userConfig ? mergeConfigs([fixtureDefaults.config, userConfig]) : fixtureDefaults.config
  ) as UserConfig

  return new PandaContext({
    ...fixtureDefaults,
    config: resolvedConfig,
    tsconfig: {
      // @ts-expect-error
      useInMemoryFileSystem: true,
    },
  })
}
