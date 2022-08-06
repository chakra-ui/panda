import type { TConfig } from './config'

export type Context = {
  tempFilePath: string
  version: string
  files: string[]
  config: TConfig
  configPath: string
  outfilePath: string
  tokensMap: Map<string, string>
  conditionsMap: Map<string, string>
}
