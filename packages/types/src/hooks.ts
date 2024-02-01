import type { Artifact, ArtifactId, DiffConfigResult } from './artifact'
import type { LoadConfigResult, UserConfig } from './config'
import type { HooksApiInterface } from './hooks-api'
import type { LoggerInterface } from './logger'
import type { ParserResultInterface } from './parser'

type MaybeAsyncReturn<T = void> = Promise<T> | T

interface TokenCssVarOptions {
  fallback?: string
  prefix?: string
  hash?: boolean
}

interface TokenCssVar {
  var: `--${string}`
  ref: string
}

export interface TokenConfigureOptions {
  formatTokenName?: (path: string[]) => string
  formatCssVar?: (path: string[], options: TokenCssVarOptions) => TokenCssVar
}

export interface TokenCreatedHookArgs {
  configure(opts: TokenConfigureOptions): void
}

export interface UtilityConfigureOptions {
  toHash?(path: string[], toHash: (str: string) => string): string
}

export interface UtilityCreatedHookArgs {
  configure(opts: UtilityConfigureOptions): void
}

export interface ConfigResolvedHookArgs {
  config: LoadConfigResult['config']
  path: string
  dependencies: string[]
}

export interface PandaHooks {
  /**
   * Called when the config is resolved, after all the presets are loaded and merged.
   * This is the first hook called, you can use it to tweak the config before the context is created.
   */
  'config:resolved': (args: ConfigResolvedHookArgs) => MaybeAsyncReturn
  /**
   * Called when the token engine has been created
   */
  'tokens:created': (args: TokenCreatedHookArgs) => MaybeAsyncReturn
  /**
   * Called when the classname engine has been created
   */
  'utility:created': (args: UtilityCreatedHookArgs) => MaybeAsyncReturn
  /**
   * Called when the Panda context has been created and the API is ready to be used.
   */
  'context:created': (args: { ctx: HooksApiInterface; logger: LoggerInterface }) => void
  /**
   * Called when the config file or one of its dependencies (imports) has changed.
   */
  'config:change': (args: { config: UserConfig; changes: DiffConfigResult }) => MaybeAsyncReturn
  /**
   * Called after reading the file content but before parsing it.
   * You can use this hook to transform the file content to a tsx-friendly syntax so that Panda's parser can parse it.
   * You can also use this hook to parse the file's content on your side using a custom parser, in this case you don't have to return anything.
   */
  'parser:before': (args: { filePath: string; content: string }) => string | void
  /**
   * Called after the file styles are extracted and processed into the resulting ParserResult object.
   * You can also use this hook to add your own extraction results from your custom parser to the ParserResult object.
   */
  'parser:after': (args: { filePath: string; result: ParserResultInterface | undefined }) => void
  /**
   * Called right before writing the codegen files to disk.
   * You can use this hook to tweak the codegen files before they are written to disk.
   */
  'codegen:prepare': (args: { artifacts: Artifact[]; changed: ArtifactId[] | undefined }) => MaybeAsyncReturn
  /**
   * Called after the codegen is completed
   */
  'codegen:done': (args: { changed: ArtifactId[] | undefined }) => MaybeAsyncReturn
  /**
   * Called right before adding the design-system CSS (global, static, preflight, tokens, keyframes) to the final CSS
   * Called right before writing/injecting the final CSS (styles.css) that contains the design-system CSS and the parser CSS
   * You can use it to tweak the CSS content before it's written to disk or injected through the postcss plugin.
   */
  'cssgen:done': (args: {
    artifact: 'global' | 'static' | 'reset' | 'tokens' | 'keyframes' | 'styles.css'
    content: string
  }) => string | void
}
