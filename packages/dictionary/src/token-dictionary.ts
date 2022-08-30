import { Tokens, SemanticTokens } from '@css-panda/types'
import dlv from 'lodash.get'
import { match, P } from 'ts-pattern'
import { TokenData } from './get-token-data'
import { mapSemanticTokens, mapTokens } from './map-token'

export type VarData = Record<'category' | 'value', string>

/**
 * The token dictionary is a map of tokens to values
 * - stores the css variable name and the value of the token
 * - serves as the interface to other systems
 * - supports semantic tokens
 */
export class Dictionary {
  /**
   * The original token definitions
   */
  private tokens: Partial<Tokens>
  private semanticTokens: Partial<SemanticTokens>
  private prefix: string | undefined

  constructor({
    tokens,
    semanticTokens = {},
    prefix,
  }: {
    tokens: Partial<Tokens>
    semanticTokens?: Partial<SemanticTokens>
    prefix?: string
  }) {
    this.tokens = tokens
    this.semanticTokens = semanticTokens
    this.prefix = prefix
    this.assignTokens()
    this.assignSemanticTokens()
  }

  assignTokens() {
    mapTokens(
      this.tokens,
      (data) => {
        this.values.set(data.prop, data)
        if (!data.negative) {
          this.vars.set(data.var, {
            category: data.category,
            value: data.value,
          })
        }
      },
      { prefix: this.prefix },
    )
  }

  assignSemanticTokens() {
    mapSemanticTokens(
      this.semanticTokens,
      (data, condition) => {
        const value = this.resolve(data.category, data.value)

        match([condition, data.negative])
          .with(['base', true], () => {
            data.value = data.varRef
            this.values.set(data.prop, data)
          })
          .with(['base', false], () => {
            data.value = data.varRef
            this.values.set(data.prop, data)
            this.vars.set(data.var, {
              category: data.category,
              value,
            })
          })
          .with([P.string, false], () => {
            if (!this.conditionVars.get(condition)) {
              this.conditionVars.set(condition, new Map())
            }
            this.conditionVars.get(condition)!.set(data.var, {
              category: data.category,
              value,
            })
          })
          .otherwise(() => {})
      },
      { prefix: this.prefix },
    )
  }

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
  get categoryMap() {
    const map = new Map<string, Map<string, TokenData>>()
    for (const value of this.values.values()) {
      map.get(value.category) ?? map.set(value.category, new Map())
      map.get(value.category)!.set(value.key, value)
    }
    return map
  }

  get flattenedTokens() {
    const map = new Map<string, Record<string, string>>()

    for (const [category, data] of this.categoryMap.entries()) {
      for (const [token, tokenData] of data.entries()) {
        map.get(category) ?? map.set(category, {})
        map.get(category)![token] = tokenData.varRef
      }
    }

    return map
  }

  query(path: string) {
    const obj = Object.fromEntries(this.flattenedTokens.entries())
    return dlv(obj, path)
  }
}
