import { type ProjectOptions as TsProjectOptions } from 'ts-morph'
import type { ParserOptions } from '@pandacss/generator'
import type { ConfigTsOptions, PandaHookable, Runtime } from '@pandacss/types'

export type ProjectOptions = Partial<TsProjectOptions> & {
  readFile: Runtime['fs']['readFileSync']
  getFiles: () => string[]
  hooks: PandaHookable
  parserOptions: ParserOptions
  tsOptions?: ConfigTsOptions
}
