import type { LoadConfigResult, UserConfig } from './config'
import type { Hookable, HookKeys } from 'hookable'
import type { ParserResultType } from './parser'
import type { TokenDictionary } from '@pandacss/token-dictionary'

type MaybeAsyncReturn = Promise<void> | void

export interface PandaHooks {
  /**
   * Called when the config is resolved, after all the presets are loaded and merged.
   */
  'config:resolved': (conf: LoadConfigResult) => MaybeAsyncReturn
  /**
   * Called when the config file or one of its dependencies (imports) has changed.
   */
  'config:change': (ctx: UserConfig) => MaybeAsyncReturn
  /**
   * Called after creating the TokenDictionary from the resolved config.
   */
  'generator:tokens': (tokenDictionary: TokenDictionary) => void
  /**
   * Called after reading the file content but before parsing it.
   */
  'parser:before': (file: string, content: string) => void
  /**
   * Called after the file styles are extracted and processed into the resulting ParserResult object.
   */
  'parser:after': (file: string, result: ParserResultType | undefined) => void
  /**
   * Called after the extracted ParserResult has been transformed to a CSS string
   */
  'parser:css': (file: string, css: string | undefined) => void
  /**
   * Called before generating the design-system CSS files (global, static, preflight, tokens, keyframes)
   */
  'generator:css': (
    file: 'global.css' | 'static.css' | 'reset.css' | 'tokens.css' | 'keyframes.css',
    css: string,
  ) => void
}

export type PandaHookable = Hookable<PandaHooks, HookKeys<PandaHooks>>
export interface ConfigResultWithHooks extends LoadConfigResult {
  hooks: PandaHookable
}
