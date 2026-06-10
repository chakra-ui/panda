import { mergeConfigs } from '@pandacss/config'
import { PandaContext } from '@pandacss/node'
import presetBase from '@pandacss/preset-base'
import presetPanda from '@pandacss/preset-panda'
import { parseJson, stringifyJson } from '@pandacss/shared'

const defaults = {
  cwd: '',
  outdir: 'styled-system',
  include: [],
  cssVarRoot: ':where(html)',
  jsxFramework: 'react',
}

const config = {
  ...presetBase,
  conditions: {
    ...presetBase.conditions,
    dark: '[data-theme=dark] &, .dark &, &.dark, &[data-theme=dark]',
    light: '[data-theme=light] &, .light &, &.light, &[data-theme=light]',
  },
  theme: {
    ...presetPanda.theme,
    textStyles: {
      headline: {
        DEFAULT: {
          value: {
            fontSize: '1.5rem',
            fontWeight: 'bold',
          },
        },
      },
    },
  },
  ...defaults,
}

const fixtureDefaults = {
  dependencies: [],
  config,
  path: '',
  hooks: {},
  serialized: stringifyJson(config),
  deserialize: () => parseJson(stringifyJson(config)),
}

export function createContext(userConfig: Record<string, any> = {}) {
  const resolvedConfig = mergeConfigs([userConfig.eject ? {} : fixtureDefaults.config, userConfig])

  return new PandaContext({
    ...fixtureDefaults,
    hooks: userConfig.hooks ?? {},
    config: Object.assign({}, defaults, resolvedConfig),
    tsconfig: {
      ...userConfig.tsconfig,
      useInMemoryFileSystem: true,
    },
  } as any)
}
