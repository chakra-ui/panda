import type { DotPath, Loose, TDotPath } from './shared'
import type { CssKeyframes, CssProperty } from './panda-csstype'
import { UtilityConfig } from './css-utility'
import { Conditions as TConditions } from './conditions'

type TBreakpoints = {
  [breakpoint: string]: string
}

type TTokens = {
  [key: string]: string | TTokens
}

type SemanticTokens<Tokens extends TDotPath, Conditions, Breakpoints> = {
  [K in keyof Tokens]?: {
    [token: string]: {
      [P in keyof Conditions | keyof Breakpoints | '_']?: DotPath<Tokens>
    }
  }
}

export type TSemanticToken = {
  [token: string]: {
    [condition: string]: string
  }
}

export type TSemanticTokens = {
  [category: string]: TSemanticToken
}

type TokensMap<Tokens> = {
  [K in keyof Tokens]?: Array<CssProperty | Loose>
}

type Shorthands = {
  [shorthand: string]: Array<CssProperty>
}

export type Format = 'css' | 'cjs' | 'esm' | 'dts'

export type Config<
  Conditions extends TConditions = TConditions,
  Breakpoints extends TBreakpoints = TBreakpoints,
  Tokens extends TTokens = TTokens,
> = {
  clean?: boolean
  format?: Format[]
  outDir?: string
  prefix?: string
  incremental?: boolean
  content?: string[]
  conditions?: TConditions
  breakpoints?: Breakpoints
  keyframes?: CssKeyframes
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
