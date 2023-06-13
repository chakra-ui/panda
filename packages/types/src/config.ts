import type { Conditions } from './conditions'
import type { PandaHooks } from './hooks'
import type { PatternConfig } from './pattern'
import type { Extendable, RequiredBy, UnwrapExtend } from './shared'
import type { StaticCssOptions } from './static-css'
import type { GlobalStyleObject } from './system-types'
import type { Theme } from './theme'
import type { UtilityConfig } from './utility'

type StudioOptions = {
  /**
   * Used to customize the design system studio
   * @default { title: 'Panda', logo: '🐼' }
   */
  studio?: {
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

type PresetCore = {
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

type ExtendableOptions = {
  [K in keyof PresetCore]?: Extendable<PresetCore[K]>
}

type FileSystemOptions = {
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
   * File extension for generated javascript files.
   */
  outExtension?: 'mjs' | 'js'
  /**
   * The log level for the built-in logger.
   * @default 'info'
   */
  logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'silent'
}

type JsxFramework = 'react' | 'solid' | 'preact' | 'vue' | 'qwik'

type JsxOptions = {
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
}

type CssgenOptions = {
  /**
   * Whether to include css reset styles in the generated css.
   * @default true
   */
  preflight?: boolean | { scope: string }
  /**
   * The namespace prefix for the generated css classes and css variables.
   * @default ''
   */
  prefix?: string | { cssVar: string; className: string }
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
   * @experimental
   * Used to generate css utility classes for your project.
   */
  staticCss?: StaticCssOptions
}

type CodegenOptions = {
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
   * Whether to hash the generated class names.
   * This is useful if want to shorten the class names.
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
}

type PresetOptions = {
  /**
   * Used to create reusable config presets for your project or team.
   */
  presets?: (string | Preset | Promise<Preset>)[]
}

type HooksOptions = {
  hooks?: PandaHooks
}

export type Config = StudioOptions &
  ExtendableOptions &
  CssgenOptions &
  CodegenOptions &
  FileSystemOptions &
  JsxOptions &
  PresetOptions &
  HooksOptions

export type Preset = ExtendableOptions & PresetOptions

export type UserConfig = UnwrapExtend<RequiredBy<Config, 'outdir' | 'cwd' | 'include'>>

export type LoadConfigResult = {
  path: string
  config: UserConfig
  dependencies: string[]
}
