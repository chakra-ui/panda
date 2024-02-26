import { parseJson, stringifyJson } from '@pandacss/shared'
import type { LoadConfigResult, UserConfig } from '@pandacss/types'

const inMemoryConfig: UserConfig = {
  preflight: true,
  include: ['./src/**/*.{js,jsx,ts,tsx}', './pages/**/*.{js,jsx,ts,tsx}', './app/**/*.{js,jsx,ts,tsx}'],
  cwd: '',
  outdir: 'styled-system',
}

export const inMemoryConfigResult = {
  dependencies: [],
  config: inMemoryConfig,
  path: '',
  hooks: {},
  serialized: stringifyJson(inMemoryConfig),
  deserialize: () => parseJson(stringifyJson(inMemoryConfig)),
} as LoadConfigResult
