import type { DotPath, Loose, TDotPath } from './shared'
import type { Keyframes, CssProperty } from './panda-csstype'
import { UtilityConfig } from './css-utility'
import { Conditions as TConditions } from './conditions'
import { Dict, RequiredBy } from './helper'

type TBreakpoints = {
  [breakpoint: string]: string
}

export type TTokens = {
  [key: string]: string | TTokens
}

export type SemanticTokens<Tokens extends TDotPath = Dict, Conditions = Dict, Breakpoints = Dict> = {
  [K in keyof Tokens]?: {
    [token: string]: {
      [P in keyof Conditions | keyof Breakpoints | '_' | 'base']?: DotPath<Tokens>
    }
  }
}

type TokensMap<Tokens> = {
  [K in keyof Tokens]?: Array<CssProperty | Loose>
}

type Shorthands = {
  [shorthand: string]: Array<CssProperty>
}

export type Config<
  Conditions extends TConditions = TConditions,
  Breakpoints extends TBreakpoints = TBreakpoints,
  Tokens extends TTokens = TTokens,
> = {
  cwd?: string
  hash?: boolean
  clean?: boolean
  outdir?: string
  prefix?: string
  incremental?: boolean
  content?: string[]
  ignore?: string[]
  conditions?: TConditions
  breakpoints?: Breakpoints
  keyframes?: Keyframes
  tokens?: Tokens
  tokensMap?: TokensMap<Tokens>
  semanticTokens?: SemanticTokens<Tokens, Conditions, Breakpoints>
  shorthands?: Shorthands
  utilities?: UtilityConfig<Tokens>[]
}

export type TConfig = Config<TConditions, TBreakpoints, TTokens>

export function defineConfig<Conditions extends TConditions, Breakpoints extends TBreakpoints, Tokens extends TTokens>(
  config: Partial<Config<Conditions, Breakpoints, Tokens>>,
): Partial<Config<Conditions, Breakpoints, Tokens>> {
  return config
}

export type UserConfig = RequiredBy<Config, 'outdir' | 'cwd' | 'content'>
