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
  preflight?: boolean
  minify?: boolean
  cwd?: string
  hash?: boolean
  clean?: boolean
  outdir?: string
  cssVar?: {
    prefix?: string
    root?: string
  }
  include?: string[]
  exclude?: string[]
  watch?: boolean
  conditions?: TConditions
  breakpoints?: Breakpoints
  keyframes?: Keyframes
  tokens?: Tokens
  semanticTokens?: SemanticTokens<Tokens, Conditions, Breakpoints>
  utilities?: Utility<Tokens>[]
  recipes?: Recipe[]
  patterns?: Pattern[]
}

export type TConfig = Config<TConditions, Dict, Dict>

export type UserConfig = RequiredBy<Config, 'outdir' | 'cwd' | 'include'>
