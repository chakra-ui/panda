import { mergeConfigs } from '@pandacss/config'
import { utils } from '@pandacss/config/utils'
import { Generator } from '@pandacss/generator'
import { PandaContext } from '@pandacss/node'
import { stringifyJson, parseJson } from '@pandacss/shared'
import type { Config, LoadConfigResult, UserConfig } from '@pandacss/types'
import { fixturePreset } from './config'
import { RuleProcessor } from '@pandacss/core'

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
  hooks: {},
  serialized: stringifyJson(config),
  deserialize: () => parseJson(stringifyJson(config)),
} as LoadConfigResult

export const createGeneratorContext = (userConfig?: Config) => {
  const resolvedConfig = (
    userConfig ? mergeConfigs([userConfig, fixtureDefaults.config]) : fixtureDefaults.config
  ) as UserConfig

  return new Generator({ ...fixtureDefaults, config: resolvedConfig })
}

export const createContext = (userConfig?: Config) => {
  let resolvedConfig = (
    userConfig ? mergeConfigs([userConfig, userConfig.eject ? {} : fixtureDefaults.config]) : fixtureDefaults.config
  ) as UserConfig

  const hooks = userConfig?.hooks ?? {}

  // This allows editing the config before the context is created
  // since this function is only used in tests, we only look at the user hooks
  // not the presets hooks, so that we can keep this fn sync
  if (hooks['config:resolved']) {
    const result = hooks['config:resolved']({
      config: resolvedConfig,
      path: fixtureDefaults.path,
      dependencies: fixtureDefaults.dependencies,
      utils,
    })
    if (result) {
      resolvedConfig = result as UserConfig
    }
  }

  return new PandaContext({
    ...fixtureDefaults,
    hooks: userConfig?.hooks ?? {},
    config: {
      ...fixtureDefaults.config,
      ...resolvedConfig,
    },
    tsconfig: {
      // @ts-expect-error
      useInMemoryFileSystem: true,
    },
  })
}

export const createRuleProcessor = (userConfig?: Config) => {
  const ctx = createContext(userConfig)
  return new RuleProcessor(ctx)
}
