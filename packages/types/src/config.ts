import type { TSConfig } from 'pkg-types'
import type { Conditions, ExtendableConditions } from './conditions'
import type { PandaHooks } from './hooks'
import type { PatternConfig } from './pattern'
import type { Keys, PathIn, RequiredBy } from './shared'
import type { StaticCssOptions } from './static-css'
import type { ExtendableGlobalStyleObject, GlobalStyleObject } from './system-types'
import type { ExtendableTheme, Theme } from './theme'
import type { ExtendableUtilityConfig, UtilityConfig } from './utility'

export type { TSConfig }

export type CascadeLayer = 'reset' | 'base' | 'tokens' | 'recipes' | 'utilities'

export type CascadeLayers = Record<CascadeLayer, string>

export interface StudioOptions {
  /**
   * Used to customize the design system studio
   * @default { title: 'Panda', logo: '🐼' }
   */
  studio?: {
    /**
     * The output directory for the design system studio when the build command is run.
     */
    outdir?: string
    /**
     * The logo url for the design system studio.
     */
    logo?: string
    /**
     * Used to inject custom html into the head or body of the studio
     */
    inject?: {
      head?: string
      body?: string
    }
  }
}

interface Patterns {
  [pattern: string]: PatternConfig
}

export interface PresetCore {
  /**
   * The css selectors or media queries shortcuts.
   * @example `{ hover: "&:hover" }`
   */
  conditions: Conditions
  /**
   * The global styles for your project.
   */
  globalCss: GlobalStyleObject
  /**
   * Used to generate css utility classes for your project.
   */
  staticCss: StaticCssOptions
  /**
   * The theme configuration for your project.
   */
  theme: Theme
  /**
   * The css utility definitions.
   */
  utilities: UtilityConfig
  /**
   * Common styling or layout patterns for your project.
   */
  patterns: Record<string, PatternConfig>
}

interface ExtendablePatterns {
  [pattern: string]: PatternConfig | Patterns | undefined
  extend?: Patterns | undefined
}

interface ExtendableStaticCssOptions extends StaticCssOptions {
  extend?: StaticCssOptions | undefined
}

export interface ExtendableOptions {
  /**
   * The css selectors or media queries shortcuts.
   * @example `{ hover: "&:hover" }`
   */
  conditions?: ExtendableConditions
  /**
   * The global styles for your project.
   */
  globalCss?: ExtendableGlobalStyleObject
  /**
   * Used to generate css utility classes for your project.
   */
  staticCss?: ExtendableStaticCssOptions
  /**
   * The theme configuration for your project.
   */
  theme?: ExtendableTheme
  /**
   * The css utility definitions.
   */
  utilities?: ExtendableUtilityConfig
  /**
   * Common styling or layout patterns for your project.
   */
  patterns?: ExtendablePatterns
}

export interface OutdirImportMap {
  css: string
  recipes: string
  patterns: string
  jsx?: string
}

interface FileSystemOptions {
  /**
   * Whether to clean the output directory before generating the css.
   * @default false
   */
  clean?: boolean
  /**
   * The output directory.
   * @default 'styled-system'
   */
  outdir?: string
  /**
   * Allows you to customize the import paths for the generated outdir.
   * @default
   * ```js
   * {
   *    css: 'styled-system/css',
   *    recipes: 'styled-system/recipes',
   *    patterns: 'styled-system/patterns',
   *    jsx: 'styled-system/jsx',
   * }
   * ```
   */
  importMap?: string | OutdirImportMap
  /**
   * List of files glob to watch for changes.
   * @default []
   */
  include?: string[]
  /**
   * List of files glob to ignore.
   * @default []
   */
  exclude?: string[]
  /**
   * Whether to watch for changes and regenerate the css.
   * @default false
   */
  watch?: boolean
  /**
   * Whether to use polling instead of filesystem events when watching.
   * @default false
   */
  poll?: boolean
  /**
   * The current working directory.
   * @default 'process.cwd()'
   */
  cwd?: string
  /**
   * The log level for the built-in logger.
   * @default 'info'
   */
  logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'silent'
}

type JsxFramework = 'react' | 'solid' | 'preact' | 'vue' | 'qwik'

interface JsxOptions {
  /**
   * The framework to use for generating supercharged elements.
   */
  jsxFramework?: JsxFramework
  /**
   * The factory name of the element
   * @default 'styled'
   *
   * @example
   * ```jsx
   * <styled.button marginTop="40px">Click me</styled.button>
   * ```
   */
  jsxFactory?: string
  /**
   * The style props allowed on generated JSX components
   * - When set to 'all', all style props are allowed.
   * - When set to 'minimal', only the `css` prop is allowed.
   * - When set to 'none', no style props are allowed and therefore the jsxFactory will not be importable.
   *
   * @default 'all'
   *
   * @example with 'all':
   * ```jsx
   * <styled.button marginTop="40px">Click me</styled.button>
   * ```
   *
   * @example with 'minimal':
   * ```jsx
   * <styled.button css={{ marginTop: "40px" }}>Click me</styled.button>
   * ```
   *
   * @example with 'none':
   * ```jsx
   * <button className={css({ marginTop: "40px" })}>Click me</button>
   * ```
   */
  jsxStyleProps?: 'all' | 'minimal' | 'none'
}

interface CssgenOptions {
  /**
   * Whether to include css reset styles in the generated css.
   * @default true
   */
  preflight?: boolean | { scope: string }
  /**
   * The namespace prefix for the generated css classes and css variables.
   * @default ''
   */
  prefix?: string | { cssVar?: string; className?: string }
  /**
   * The value separator used in the generated class names.
   * @default '_'
   */
  separator?: '_' | '=' | '-'
  /**
   * Whether to optimize the generated css.
   * @default true
   */
  optimize?: boolean
  /**
   * Whether to minify the generated css.
   * @default false
   */
  minify?: boolean
  /**
   * The root selector for the css variables.
   * @default ':where(:host, :root)'
   */
  cssVarRoot?: string
  /**
   * The css syntax kind to use
   * @default 'object-literal'
   */
  syntax?: 'template-literal' | 'object-literal'
}

interface CodegenOptions {
  /**
   * Whether to emit the artifacts to `node_modules` as a package.
   * @default false
   */
  emitPackage?: boolean
  /**
   * Whether to only emit the `tokens` directory
   * @default false
   */
  emitTokensOnly?: boolean
  /**
   * Whether to hash the generated class names / css variables.
   * This is useful if want to shorten the class names or css variables.
   * @default false
   */
  hash?: boolean | { cssVar: boolean; className: boolean }
  /**
   * Options for the generated typescript definitions.
   */
  strictTokens?: boolean
  /**
   * Whether to update the .gitignore file.
   * @default 'true'
   */
  gitignore?: boolean
  /**
   * Whether to allow shorthand properties
   * @default 'true'
   */
  shorthands?: boolean
  /**
   * Layer mappings used in the generated css.
   * @default 'true'
   */
  layers?: Partial<CascadeLayers>
  /**
   * File extension for generated javascript files.
   * @default 'mjs'
   */
  outExtension?: 'mjs' | 'js'
  /**
   * Whether to force consistent type extensions for generated typescript .d.ts files.
   * If set to `true` and `outExtension` is set to `mjs`, the generated typescript .d.ts files will have the extension `.d.mts`.
   * @default false
   */
  forceConsistentTypeExtension?: boolean
}

interface PresetOptions {
  /**
   * Used to create reusable config presets for your project or team.
   */
  presets?: (string | Preset | Promise<Preset>)[]
  /**
   * Whether to opt-out of the defaults config presets: [`@pandacss/preset-base`, `@pandacss/preset-panda`]
   * @default 'false'
   */
  eject?: boolean
}

interface HooksOptions {
  hooks?: Partial<PandaHooks>
}

export interface Config
  extends StudioOptions,
    ExtendableOptions,
    CssgenOptions,
    CodegenOptions,
    FileSystemOptions,
    JsxOptions,
    PresetOptions,
    HooksOptions {}

export interface Preset extends ExtendableOptions, PresetOptions {}

export interface UserConfig
  extends Partial<PresetCore>,
    RequiredBy<Omit<Config, keyof PresetCore>, 'outdir' | 'cwd' | 'include'> {}

export interface PathMapping {
  pattern: RegExp
  paths: string[]
}

export interface ConfigTsOptions {
  baseUrl?: string | undefined
  pathMappings: PathMapping[]
}

export interface LoadConfigResult {
  /** Config path */
  path: string
  config: UserConfig
  serialized: string
  deserialize: () => Config
  tsconfig?: TSConfig
  tsOptions?: ConfigTsOptions
  tsconfigFile?: string
  dependencies: string[]
}

export interface HashOptions {
  tokens: boolean | undefined
  className: boolean | undefined
}

export interface PrefixOptions {
  tokens: string | undefined
  className: string | undefined
}

type ReqConf = Required<UserConfig>

export type ConfigPath = Exclude<
  | Exclude<NonNullable<Keys<ReqConf>>, 'theme'>
  | PathIn<ReqConf, 'theme'>
  | PathIn<ReqConf, 'patterns'>
  | PathIn<ReqConf, 'staticCss'>
  | (string & {}),
  undefined
>
