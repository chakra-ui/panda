import type { Conditions as TConditions } from './conditions'
import type { Utility } from './css-utility'
import type { Dict, RequiredBy } from './helper'
import type { Keyframes } from './panda-csstype'
import type { Pattern } from './pattern'
import type { Recipe } from './recipe'
import type { DotPath, TDotPath } from './shared'
import type { PartialTokens } from './tokens'

export type SemanticTokens<Tokens extends TDotPath = Dict, Conditions = Dict, Breakpoints = Dict> = {
  [K in keyof Tokens]?: {
    [token: string]: {
      [P in keyof Conditions | keyof Breakpoints | '_' | 'base']?: DotPath<Tokens>
    }
  }
}

export type Config<
  Conditions extends TConditions = TConditions,
  Breakpoints extends Dict = Dict,
  Tokens extends PartialTokens = PartialTokens,
> = {
  /**
   * Whether to include css reset styles in the generated css.
   */
  preflight?: boolean | { scope: string }
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
   * The css variable options for the generated design tokens
   */
  cssVar?: {
    /**
     * The prefix for the css variables.
     */
    prefix?: string
    /**
     * The root selector for the css variables.
     * @default ':where(:host, :root)'
     */
    root?: string
  }
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
   * The css selectors or media queries shortcuts.
   * @example `{ hover: "&:hover" }`
   */
  conditions?: TConditions
  /**
   * The breakpoints for your project.
   */
  breakpoints?: Breakpoints
  /**
   * The css animation keyframes definitions.
   */
  keyframes?: Keyframes
  /**
   * The design tokens for your project.
   */
  tokens?: Tokens
  /**
   * The semantic design tokens for your project.
   */
  semanticTokens?: SemanticTokens<Tokens, Conditions, Breakpoints>
  /**
   * The css utility definitions.
   */
  utilities?: Utility<Tokens>[]
  /**
   * Multi-variant style definitions for your project.
   * Useful for defining component styles.
   */
  recipes?: Recipe[]
  /**
   * Common styling or layout patterns for your project.
   */
  patterns?: Pattern[]
}

export type TConfig = Config<TConditions, Dict, Dict>

export type UserConfig = RequiredBy<Config, 'outdir' | 'cwd' | 'include'>
