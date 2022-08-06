import type { DotPath, Loose, TDotPath } from './shared'
import type { CSSKeyframes, CSSPropertiesWithSelectors, CSSProperty } from './css-type'

type TCondition = {
  [condition: string]: {
    selector?: string | string[]
    '@media'?: string
  }
}

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
  [K in keyof Tokens]?: Array<CSSProperty | Loose>
}

type Shorthands = {
  [shorthand: string]: Array<CSSProperty>
}

type TokenGetter<T extends TDotPath> = (token: DotPath<T>) => string | undefined

type Utilities<T extends TDotPath> = {
  [utility: string]: (options: { value: string; $: TokenGetter<T> }) => CSSPropertiesWithSelectors
}

export type Format = 'css' | 'cjs' | 'esm' | 'dts'

export type Config<Conditions extends TCondition, Breakpoints extends TBreakpoints, Tokens extends TTokens> = {
  format: Format[]
  outfile: string
  prefix: string
  incremental: boolean
  content: string[]
  conditions: Conditions
  breakpoints: Breakpoints
  keyframes: CSSKeyframes
  tokens: Tokens
  tokensMap: TokensMap<Tokens>
  semanticTokens: SemanticTokens<Tokens, Conditions, Breakpoints>
  shorthands: Shorthands
  utilities: Utilities<Tokens>
}

export type TConfig = Config<TCondition, TBreakpoints, TTokens>

export function defineConfig<Conditions extends TCondition, Breakpoints extends TBreakpoints, Tokens extends TTokens>(
  config: Partial<Config<Conditions, Breakpoints, Tokens>>,
): Partial<Config<Conditions, Breakpoints, Tokens>> {
  return config
}
