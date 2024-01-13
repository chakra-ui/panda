import type { ApiInterface } from './api'
import type { LoadConfigResult, UserConfig } from './config'
import type { ParserResultInterface } from './parser'

type MaybeAsyncReturn<T = void> = Promise<T> | T

export interface PandaHooks {
  /**
   * Called when the config is resolved, after all the presets are loaded and merged.
   * This is the first hook called, you can use it to tweak the config before the context is created.
   */
  'config:resolved': (conf: LoadConfigResult) => MaybeAsyncReturn
  /**
   * Called when the Panda context has been created and the API is ready to be used.
   */
  'context:created': (ctx: ApiInterface) => void
  /**
   * Called when the config file or one of its dependencies (imports) has changed.
   */
  'config:change': (ctx: UserConfig) => MaybeAsyncReturn
  /**
   * Called after reading the file content but before parsing it.
   * You can use this hook to tweak the file content before being parsed, or to parse it yourself using a custom parser.
   */
  'parser:before': (file: string, content: string) => void
  /**
   * Called after the file styles are extracted and processed into the resulting ParserResult object.
   * You can use this hook to add your own extraction results from your custom parser to the ParserResult object.
   */
  'parser:after': (file: string, result: ParserResultInterface | undefined) => void
  /**
   * Called before generating the design-system CSS (global, static, preflight, tokens, keyframes)
   */
  'generator:css': (file: 'global.css' | 'static.css' | 'reset.css' | 'tokens.css' | 'keyframes.css') => void
  /**
   * Called after the codegen is completed
   */
  'codegen:done': () => MaybeAsyncReturn
  /**
   * Called before writing/injecting the final CSS
   * This is the last hook called, you can use it to tweak the final CSS before it's written to disk or injected through the postcss plugin.
   */
  'css:transform': (content: string) => MaybeAsyncReturn<string | void>
}
