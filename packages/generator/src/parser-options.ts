import type { Context } from '@pandacss/core'
import type { ConfigResultWithHooks, TSConfig } from '@pandacss/types'

export interface ParserOptions {
  hash: Context['hash']
  imports: Context['imports']
  jsx: Context['jsx']
  syntax: Context['config']['syntax']
  recipes: Context['recipes']
  patterns: Context['patterns']
  encoder: Context['encoder']
  join: (...paths: string[]) => string
  compilerOptions: TSConfig['compilerOptions']
  tsOptions: ConfigResultWithHooks['tsOptions']
}
