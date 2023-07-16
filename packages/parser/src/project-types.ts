import { type ProjectOptions as TsProjectOptions } from 'ts-morph'
import { type ParserOptions } from './parser'
import type { ConfigTsOptions, PandaHookable, Runtime } from '@pandacss/types'

export type ProjectOptions = Partial<TsProjectOptions> & {
  readFile: Runtime['fs']['readFileSync']
  getFiles: () => string[]
  join: Runtime['path']['join']
  hooks: PandaHookable
  parserOptions: ParserOptions
  tsOptions?: ConfigTsOptions
}
