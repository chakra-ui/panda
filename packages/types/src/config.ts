import type { LayerStyles, TextStyles } from './composition'
import type { Conditions as TConditions } from './conditions'
import type { AnyPatternConfig, PatternConfig } from './pattern'
import type { AnyRecipeConfig, RecipeConfig } from './recipe'
import type { Extendable, RequiredBy, UnwrapExtend } from './shared'
import type { StaticCssOptions } from './static-css'
import type { CssKeyframes, GlobalStyleObject } from './system-types'
import type { SemanticTokens, Tokens } from './tokens'
import type { UtilityConfig } from './utility'

export type Preset = Pick<Config, 'utilities' | 'theme' | 'patterns' | 'presets' | 'conditions' | 'globalCss'>

type Studio = {
  title: string
  logo: string
}

type Theme<RecipeVariants> = {
  /**
   * The breakpoints for your project.
   */
  breakpoints?: Record<string, string>
  /**
   * The css animation keyframes definitions.
   */
  keyframes?: CssKeyframes
  /**
   * The design tokens for your project.
   */
  tokens?: Tokens
  /**
   * The semantic design tokens for your project.
   */
  semanticTokens?: SemanticTokens
  /**
   * The typography styles for your project.
   */
  textStyles?: TextStyles
  /**
   * The layer styles for your project.
   */
  layerStyles?: LayerStyles
  /**
   * Multi-variant style definitions for your project.
   * Useful for defining component styles.
   */
  recipes?: Record<string, RecipeConfig<RecipeVariants>>
}
type AnyTheme = Theme<Record<string, AnyRecipeConfig>>

export type GenericConfig<RecipeVariants, PatternProps> = Omit<Config, 'theme' | 'patterns'> & {
  theme?: Extendable<Theme<RecipeVariants>>
  patterns?: Extendable<Record<string, PatternConfig<PatternProps>>>
}

export type Config = {
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
   * The namespace prefix for the generated css classes and css variables.
   * @default ''
   */
  prefix?: string
  /**
   * Whether to update the .gitignore file.
   * @default 'true'
   */
  gitignore?: boolean
  /**
   * The value separator used in the generated class names.
   * @default '_'
   */
  separator?: '_' | '=' | '-'
  /**
   * Used to customize the design system studio
   * @default { title: 'Panda', logo: '🐼' }
   */
  studio?: Partial<Studio>
  /**
   * The log level for the built-in logger.
   * @default 'info'
   */
  logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'silent'
  /**
   * Used to create reusable config presets for your project or team.
   */
  presets?: (string | Preset)[]
  /**
   * Whether to include css reset styles in the generated css.
   * @default true
   */
  preflight?: boolean
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
   * The current working directory.
   * @default 'process.cwd()'
   */
  cwd?: string
  /**
   * Whether to hash the generated class names.
   * This is useful if want to shorten the class names.
   * @default false
   */
  hash?: boolean
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
   * The root selector for the css variables.
   * @default ':where(:host, :root)'
   */
  cssVarRoot?: string
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
   * The css selectors or media queries shortcuts.
   * @example `{ hover: "&:hover" }`
   */
  conditions?: Extendable<TConditions>
  /**
   * The global styles for your project.
   */
  globalCss?: Extendable<GlobalStyleObject>
  /**
   * The theme configuration for your project.
   */
  theme?: Extendable<AnyTheme>
  /**
   * The css utility definitions.
   */
  utilities?: Extendable<UtilityConfig>
  /**
   * Common styling or layout patterns for your project.
   */
  patterns?: Extendable<Record<string, AnyPatternConfig>>
  /**
   * The framework to use for generating supercharged elements.
   */
  jsxFramework?: 'react' | 'solid' | 'preact' | 'vue'
  /**
   * The factory name of the element
   * @default 'panda'
   *
   * @example
   * ```jsx
   * <panda.button marginTop="40px">Click me</panda.button>
   * ```
   */
  jsxFactory?: string
  /**
   * Options for the generated typescript definitions.
   */
  strictTokens?: boolean
  /**
   * @experimental
   * Used to generate css utility classes for your project.
   */
  staticCss?: StaticCssOptions
  /**
   * File extension for generated javascript files.
   */
  outExtension?: 'mjs' | 'js'
}

export type UserConfig = UnwrapExtend<RequiredBy<Config, 'outdir' | 'cwd' | 'include'>>

export type LoadConfigResult = {
  path: string
  config: UserConfig
  dependencies: string[]
}
