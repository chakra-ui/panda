export type UtilityValueInput = string | number | boolean | null

export type UtilityResolvedScalar = string | number | boolean

export type UtilityValueSource =
  | { type: 'value-map'; key: string; aliases: string[] }
  | { type: 'literal'; aliases: string[] }
  | { type: 'token-reference' }
  | { type: 'arbitrary' }

export interface ResolveUtilityValueInput {
  prop: string
  value: UtilityValueInput
}

export interface ResolvedUtilityValue {
  utility: string
  className: string
  cssValue: UtilityResolvedScalar
  important: boolean
  source: UtilityValueSource
}

/** A token that carries a given value — a candidate the developer can pick. */
export interface TokenSuggestion {
  /** Category-relative path (`red.500`, `fg.error`). */
  token: string
  /** `true` when the token is from the semantic layer. */
  semantic: boolean
  /** `true` when the token has condition variants (themes) — not a static equal. */
  conditional: boolean
}

/** Common subset of the native `TokenDictionary` / wasm `TokenDictionaryInput`. */
export interface TokenLookup {
  values: Record<string, string>
  vars: Record<string, string>
}

export interface RawToken {
  path: string
  value: string
  var?: string
}

export interface ColorMixResult {
  invalid: boolean
  value: string
  color?: string
}
