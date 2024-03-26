import type { Artifact, ArtifactId, DiffConfigResult } from './artifact'
import type { LoadConfigResult, UserConfig } from './config'
import type { HooksApiInterface } from './hooks-api'
import type { LoggerInterface } from './logger'
import type { ParserResultInterface, ResultItem } from './parser'

export interface PandaHooks {
  /**
   * Called when the config is resolved, after all the presets are loaded and merged.
   * This is the first hook called, you can use it to tweak the config before the context is created.
   */
  'config:resolved': (args: ConfigResolvedHookArgs) => MaybeAsyncReturn<void | ConfigResolvedHookArgs['config']>
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
  'context:created': (args: ContextCreatedHookArgs) => void
  /**
   * Called when the config file or one of its dependencies (imports) has changed.
   */
  'config:change': (args: ConfigChangeHookArgs) => MaybeAsyncReturn
  /**
   * Called after reading the file content but before parsing it.
   * You can use this hook to transform the file content to a tsx-friendly syntax so that Panda's parser can parse it.
   * You can also use this hook to parse the file's content on your side using a custom parser, in this case you don't have to return anything.
   */
  'parser:before': (args: ParserResultBeforeHookArgs) => string | void
  /**
   * @private USE IT ONLY IF YOU KNOW WHAT YOU ARE DOING
   */
  'parser:preprocess': JsxFactoryResultTransform['transform']
  /**
   * Called after the file styles are extracted and processed into the resulting ParserResult object.
   * You can also use this hook to add your own extraction results from your custom parser to the ParserResult object.
   */
  'parser:after': (args: ParserResultAfterHookArgs) => void
  /**
   * Called right before writing the codegen files to disk.
   * You can use this hook to tweak the codegen files before they are written to disk.
   */
  'codegen:prepare': (args: CodegenPrepareHookArgs) => MaybeAsyncReturn<void | Artifact[]>
  /**
   * Called after the codegen is completed
   */
  'codegen:done': (args: CodegenDoneHookArgs) => MaybeAsyncReturn
  /**
   * Called right before adding the design-system CSS (global, static, preflight, tokens, keyframes) to the final CSS
   * Called right before writing/injecting the final CSS (styles.css) that contains the design-system CSS and the parser CSS
   * You can use it to tweak the CSS content before it's written to disk or injected through the postcss plugin.
   */
  'cssgen:done': (args: CssgenDoneHookArgs) => string | void
}

type MaybeAsyncReturn<T = void> = Promise<T> | T

/* -----------------------------------------------------------------------------
 * Token hooks
 * -----------------------------------------------------------------------------*/

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

/* -----------------------------------------------------------------------------
 * Utility hooks
 * -----------------------------------------------------------------------------*/

export interface UtilityConfigureOptions {
  toHash?(path: string[], toHash: (str: string) => string): string
}

export interface UtilityCreatedHookArgs {
  configure(opts: UtilityConfigureOptions): void
}

/* -----------------------------------------------------------------------------
 * Config hooks
 * -----------------------------------------------------------------------------*/

interface CallbackItem {
  value: any
  path: string
  depth: number
  parent: any[] | Record<string, unknown>
  key: string
}

type CallbackFn = (args: CallbackItem) => void

interface TraverseOptions {
  separator: string
  maxDepth?: number | undefined
}

interface TraverseFn {
  (obj: any, callback: CallbackFn, options?: TraverseOptions): void
}

interface ConfigResolvedHookUtils {
  omit: <T, K extends keyof T | (string & {})>(obj: T, paths: K[]) => Omit<T, K>
  traverse: TraverseFn
}

export interface ConfigResolvedHookArgs {
  config: LoadConfigResult['config']
  path: string
  dependencies: string[]
  utils: ConfigResolvedHookUtils
  original?: LoadConfigResult['config']
}

export interface ConfigChangeHookArgs {
  config: UserConfig
  changes: DiffConfigResult
}

/* -----------------------------------------------------------------------------
 * Parser hooks
 * -----------------------------------------------------------------------------*/

export interface ParserResultConfigureOptions {
  matchTag?: (tag: string, isPandaComponent: boolean) => boolean
  matchTagProp?: (tag: string, prop: string) => boolean
}

export interface ParserResultBeforeHookArgs {
  filePath: string
  content: string
  configure: (opts: ParserResultConfigureOptions) => void
  original?: string
}

export interface JsxFactoryResultTransform {
  transform: (result: { type: 'jsx-factory'; data: ResultItem['data'] }) => ResultItem['data']
}

export interface ParserResultAfterHookArgs {
  filePath: string
  result: ParserResultInterface | undefined
}

/* -----------------------------------------------------------------------------
 * Codegen hooks
 * -----------------------------------------------------------------------------*/

export interface CodegenPrepareHookArgs {
  artifacts: Artifact[]
  /**
   * The original state of the artifacts, as it was generated by Panda, without any modification from other preset hooks
   */
  original?: Artifact[]
  changed: ArtifactId[] | undefined
}
export interface CodegenDoneHookArgs {
  changed: ArtifactId[] | undefined
}

/* -----------------------------------------------------------------------------
 * Cssgen hooks
 * -----------------------------------------------------------------------------*/

type CssgenArtifact = 'global' | 'static' | 'reset' | 'tokens' | 'keyframes' | 'styles.css'

export interface CssgenDoneHookArgs {
  artifact: CssgenArtifact
  /**
   * The current state of the CSS, if any other preset hook has modified the CSS, this will be the modified state
   */
  content: string
  /**
   * The original state of the CSS, as it was generated by Panda, without any modification from other preset hooks
   */
  original?: string
}

/* -----------------------------------------------------------------------------
 * Context hooks
 * -----------------------------------------------------------------------------*/

export interface ContextCreatedHookArgs {
  ctx: HooksApiInterface
  logger: LoggerInterface
}
