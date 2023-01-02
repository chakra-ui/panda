import type { LayerStyles, TextStyles } from './composition'
import type { Conditions as TConditions } from './conditions'
import type { CssKeyframes, GlobalStyleObject } from './system-types'
import type { PatternConfig } from './pattern'
import type { RecipeConfig } from './recipe'
import type { Dict, Extendable, RequiredBy, StringKeyOf, UnwrapExtend } from './shared'
import type { SemanticTokens, Tokens as PartialTokens } from './tokens'
import type { UtilityConfig } from './utility'
import type { StaticCssOptions } from './static-css'

type Docs = {
  title:string
  logo:string
}

export type Config<
  Conditions extends TConditions = TConditions,
  Breakpoints extends Dict = Dict,
  Tokens extends PartialTokens = PartialTokens,
> = {
  /**
   * The value separator used in the generated class names.
   * @default '_'
   */
  separator?: '_' | '=' | '-'
   /**
   * Used to customize the design system docs
   */
   docs?: Partial<Docs>
  /**
   * The log level for the built-in logger.
   */
  logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'silent'
  /**
   * Used to create reusable config presets for your project or team.
   */
  presets?: string[]
  /**
   * Whether to include css reset styles in the generated css.
   */
  preflight?: boolean
  /**
   * Whether to minify the generated css.
   */
  minify?: boolean
  /**
   * The current working directory.
   */
  cwd?: string
  /**
   * Whether to hash the generated class names.
   * This is useful if want to shorten the class names.
   */
  hash?: boolean
  /**
   * Whether to clean the output directory before generating the css.
   */
  clean?: boolean
  /**
   * The output directory.
   */
  outdir?: string
  /**
   * The prefix for the css variables.
   */
  cssVarPrefix?: string
  /**
   * The root selector for the css variables.
   * @default ':where(:host, :root)'
   */
  cssVarRoot?: string
  /**
   * Files to watch for changes.
   */
  include?: string[]
  /**
   * Files to ignore.
   */
  exclude?: string[]
  /**
   * Whether to watch for changes and regenerate the css.
   */
  watch?: boolean
  /**
   * Whether to use polling instead of filesystem events when watching.
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
  globalCss?: GlobalStyleObject
  /**
   * The theme configuration for your project.
   */
  theme?: Extendable<{
    /**
     * The breakpoints for your project.
     */
    breakpoints?: Breakpoints
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
    semanticTokens?: SemanticTokens<StringKeyOf<Conditions> | StringKeyOf<Breakpoints> | 'base' | '_'>
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
    recipes?: Record<string, RecipeConfig>
  }>
  /**
   * The css utility definitions.
   */
  utilities?: Extendable<UtilityConfig>
  /**
   * Common styling or layout patterns for your project.
   */
  patterns?: Extendable<Record<string, PatternConfig>>
  /**
   * The framework to use for generating supercharged elements.
   * @default 'react'
   */
  jsxFramework?: 'react' | 'solid' | 'preact'
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
  static?: StaticCssOptions
}

export type TConfig = Config<TConditions, Dict, Dict>

export type UserConfig = UnwrapExtend<RequiredBy<Config, 'outdir' | 'cwd' | 'include'>>
