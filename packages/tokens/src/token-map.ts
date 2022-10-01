import type { SemanticTokens, Tokens } from '@css-panda/types'
import dlv from 'lodash.get'
import { match, P } from 'ts-pattern'
import { createSemanticTokenFn } from './semantic-token-fn'
import type { TokenData } from './token-data'
import { createTokenFn } from './token-fn'

export type VarData = Record<'category' | 'value', string>

type CategoryMap = Map<string, Map<string, TokenData>>

type FlattenedTokenMap = Map<string, Record<string, string>>

type Options = {
  tokens: Partial<Tokens>
  semanticTokens?: Partial<SemanticTokens>
  prefix?: string
}

/**
 * The token dictionary is a map of tokens to values
 * - stores the css variable name and the value of the token
 * - serves as the interface to other systems
 * - supports semantic tokens
 */
export class TokenMap {
  /**
   * The original token definitions
   */
  private tokens: Partial<Tokens>

  /**
   * The original semantic token definitions
   */
  private semanticTokens: Partial<SemanticTokens>

  /**
   * The prefix to use for the css variables
   */
  private prefix: string | undefined

  /**
   * A map of the category to the token datas
   */
  categoryMap: CategoryMap

  /**
   * A flattened map of the token key to css variable reference
   */
  flattenedTokens: FlattenedTokenMap

  /**
   * The map of token 'dot path' to the token details
   */
  values = new Map<string, TokenData>()

  /**
   * The map of token to the css variable data
   */
  vars = new Map<string, VarData>()

  /**
   * Used for semantic tokens. It is a map of the condition to the token maps
   */
  conditionVars = new Map<string, Map<string, VarData>>()

  constructor({ tokens, semanticTokens = {}, prefix }: Options) {
    this.tokens = tokens
    this.semanticTokens = semanticTokens
    this.prefix = prefix
    this.assignTokens()
    this.assignSemanticTokens()
    this.categoryMap = this.getCategoryMap()
    this.flattenedTokens = this.getFlattenedTokens()
  }

  private assignTokens() {
    const each = createTokenFn(this.tokens, { prefix: this.prefix })
    each((token) => {
      this.values.set(token.prop, token)

      if (token.negative) return

      this.vars.set(token.var, {
        category: token.category,
        value: token.value,
      })
    })
  }

  private assignSemanticTokens() {
    const each = createSemanticTokenFn(this.semanticTokens, { prefix: this.prefix })

    each((token, condition) => {
      const value = this.resolve(token.category, token.value)

      match([condition, token.negative])
        .with(['base', true], () => {
          token.value = token.varRef
          this.values.set(token.prop, token)
        })

        .with(['base', false], () => {
          token.value = token.varRef
          this.values.set(token.prop, token)
          this.vars.set(token.var, {
            category: token.category,
            value,
          })
        })

        .with([P.string, false], () => {
          if (!this.conditionVars.get(condition)) {
            this.conditionVars.set(condition, new Map())
          }

          this.conditionVars.get(condition)!.set(token.var, {
            category: token.category,
            value,
          })
        })

        .otherwise(() => {
          // do nothing
        })
    })
  }

  /**
   * Get the css variable reference of a value
   */
  resolve(category: string, value: string) {
    const item = this.values.get(`${category}.${value}`)
    return item?.varRef ?? value
  }

  /**
   * A map of the category to the token values
   */
  private getCategoryMap() {
    const map: CategoryMap = new Map()

    for (const value of this.values.values()) {
      map.get(value.category) ?? map.set(value.category, new Map())
      map.get(value.category)!.set(value.key, value)
    }

    return map
  }

  private getFlattenedTokens() {
    const map: FlattenedTokenMap = new Map()

    for (const [category, data] of this.categoryMap.entries()) {
      for (const [token, tokenData] of data.entries()) {
        map.get(category) ?? map.set(category, {})
        map.get(category)![token] = tokenData.varRef
      }
    }

    return map
  }

  /**
   * Get the token data by dot path
   */
  get(path: string, fallback?: string | number) {
    const obj = Object.fromEntries(this.flattenedTokens)
    return dlv(obj, path, fallback)
  }

  /**
   * Whether the token map has a token
   */
  get isEmpty() {
    return this.values.size === 0
  }
}
