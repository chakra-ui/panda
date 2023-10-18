import { type ProjectOptions as TsProjectOptions } from 'ts-morph'
import { type ParserContext } from './parser'
import type { ConfigTsOptions, PandaHookable, Runtime } from '@pandacss/types'

export type ProjectOptions = Partial<TsProjectOptions> & {
  readFile: Runtime['fs']['readFileSync']
  getFiles: () => string[]
  hooks: PandaHookable
  parserOptions: ParserContext
  tsOptions?: ConfigTsOptions
}
